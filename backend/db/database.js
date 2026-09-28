import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'grocery.db');

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      stock INTEGER DEFAULT 100,
      emoji TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'confirmed',
      address TEXT NOT NULL,
      phone TEXT,
      payment_method TEXT DEFAULT 'Credit Card',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Credit Card'");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'available'");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE products ADD COLUMN old_price REAL");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE otps ADD COLUMN type TEXT DEFAULT 'general'");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE users ADD COLUMN phone TEXT");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE users ADD COLUMN address TEXT");
  } catch (e) {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '🧑‍🍳'");
  } catch (e) {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      rating INTEGER NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default admin credentials if not set
  const adminUser = db.exec("SELECT value FROM admin_settings WHERE key = 'username'");
  if (!adminUser.length || !adminUser[0].values.length) {
    db.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('username', 'admin')");
    db.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('password', 'admin123')");
    db.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('email', 'admin@freshmart.in')");
  }

  // Seed default pages if not existing
  const checkPages = db.exec("SELECT slug FROM pages");
  if (!checkPages.length || !checkPages[0].values.length) {
    db.run(`
      INSERT OR REPLACE INTO pages (slug, title, content) VALUES 
      ('about', 'About FreshMart', 'Welcome to FreshMart, your premier destination for farm-fresh groceries delivered in minutes! Founded with a passion for healthy living and farm-to-table freshness, FreshMart sources the finest seasonal fruits, organic vegetables, pure dairy products, artisan bakery goods, and pantry staples directly from trusted regional farmers and sustainable producers.\n\nOur mission is to make nutritious, fresh, and high-quality food accessible to every household at fair, transparent prices in Rupees (₹).\n\nWith our state-of-the-art cold-chain logistics and lightning-fast local delivery network, your groceries arrive in peak condition—crisp, fresh, and bursting with natural flavor. Thank you for choosing FreshMart as your trusted neighborhood grocery partner!'),
      ('policy', 'Privacy Policy & Terms of Service', 'At FreshMart, we respect your privacy and are committed to protecting your personal information.\n\n1. Information Collection: We collect details such as your name, delivery address, phone number, and order preferences solely to process and deliver your grocery orders.\n\n2. Data Security: All transactions are processed using industry-standard 256-bit SSL encryption. We never store full credit or debit card numbers on our servers.\n\n3. OTP Authentication: For your security, account changes and password updates require one-time password (OTP) verification.\n\n4. Refund & Replacement: If any item received is damaged or fails our freshness standards, report it within 24 hours for a full replacement or refund in Rupees (₹) to your original payment method.\n\n5. Terms: By using our platform, you agree to our fair usage policy and standard delivery guidelines.'),
      ('customer-care', 'Customer Care & Support', 'We are here to help you 24x7 with any questions, orders, deliveries, or feedback!\n\n📞 Toll-Free Helpline: 1800-FRESH-MART (1800-373-7462)\n📧 Support Email: support@freshmart.in\n💬 Live Chat: Mon - Sun, 6:00 AM to 11:00 PM IST\n📍 Headquarters: FreshMart Hub, 42 Green Valley Park, Tech City, India\n\nFrequently Asked Support Topics:\n• Order Tracking & Live Delivery Status\n• Damaged or Missing Grocery Items\n• Payment, UPI, & Refund Inquiries\n• Delivery Rescheduling & Address Updates\n\nFeel free to write to us or call our support line anytime—our customer delight team is always ready to assist!')
    `);
  }

  try {
    db.run("ALTER TABLE otps ADD COLUMN type TEXT DEFAULT 'password_reset'");
  } catch (e) {}

  try {
    db.run("ALTER TABLE otps ADD COLUMN payload TEXT");
  } catch (e) {}

  // Seed default products if empty
  const checkProducts = db.exec("SELECT COUNT(*) FROM products");
  if (!checkProducts.length || checkProducts[0].values[0][0] === 0) {
    const defaultProducts = [
      ['Red Apples', 'Fresh and crispy red apples, perfect for snacking or baking', 149, 'Fruits', 'kg', 150, '🍎', 'available'],
      ['Bananas', 'Ripe yellow bananas, rich in potassium and natural energy', 60, 'Fruits', 'bunch', 200, '🍌', 'available'],
      ['Oranges', 'Juicy navel oranges bursting with vitamin C', 120, 'Fruits', 'kg', 120, '🍊', 'available'],
      ['Strawberries', 'Sweet organic strawberries, hand-picked fresh daily', 180, 'Fruits', 'pack', 0, '🍓', 'sold_out'],
      ['Tomatoes', 'Vine-ripened tomatoes with rich flavor for salads and cooking', 40, 'Vegetables', 'kg', 180, '🍅', 'available'],
      ['Potatoes', 'Premium russet potatoes, ideal for roasting and mashing', 35, 'Vegetables', 'kg', 250, '🥔', 'available'],
      ['Onions', 'Fresh yellow onions, a kitchen essential for every meal', 45, 'Vegetables', 'kg', 300, '🧅', 'available'],
      ['Broccoli', 'Tender green broccoli florets packed with nutrients', 80, 'Vegetables', 'piece', 100, '🥦', 'available'],
      ['Whole Milk', 'Farm-fresh whole milk, creamy and delicious', 65, 'Dairy', 'liter', 200, '🥛', 'available'],
      ['Cheddar Cheese', 'Aged sharp cheddar cheese with rich, bold flavor', 250, 'Dairy', 'pack', 90, '🧀', 'available'],
      ['Greek Yogurt', 'Thick and creamy Greek yogurt, high in protein', 95, 'Dairy', 'pack', 150, '🥄', 'available'],
      ['Butter', 'Unsalted premium butter for cooking and baking', 110, 'Dairy', 'pack', 120, '🧈', 'available'],
      ['Sourdough Bread', 'Artisan sourdough bread with a crispy crust and soft center', 120, 'Bakery', 'loaf', 60, '🍞', 'available'],
      ['Croissants', 'Flaky French butter croissants, baked fresh every morning', 150, 'Bakery', 'pack', 70, '🥐', 'available'],
      ['Bagels', 'New York-style bagels, perfect for breakfast', 90, 'Bakery', 'pack', 80, '🥯', 'available'],
      ['Blueberry Muffins', 'Soft and fluffy muffins loaded with fresh blueberries', 130, 'Bakery', 'pack', 50, '🧁', 'available'],
      ['Orange Juice', 'Freshly squeezed 100% pure orange juice, no added sugar', 110, 'Beverages', 'liter', 130, '🧃', 'available'],
      ['Sparkling Water', 'Naturally carbonated mineral water with a crisp taste', 60, 'Beverages', 'pack', 200, '💧', 'available'],
      ['Green Tea', 'Premium Japanese green tea bags for a calming brew', 199, 'Beverages', 'pack', 100, '🍵', 'available'],
      ['Ground Coffee', 'Rich Colombian ground coffee with bold, aromatic flavor', 349, 'Beverages', 'pack', 110, '☕', 'available'],
      ['Potato Chips', 'Crispy sea salt potato chips, lightly salted', 50, 'Snacks', 'pack', 180, '🍟', 'available'],
      ['Chocolate Cookies', 'Double chocolate chip cookies with a gooey center', 80, 'Snacks', 'pack', 120, '🍪', 'available'],
      ['Roasted Almonds', 'Crunchy roasted almonds with a touch of sea salt', 299, 'Snacks', 'pack', 90, '🥜', 'available'],
      ['Granola Bars', 'Wholesome oat and honey granola bars for on-the-go energy', 120, 'Snacks', 'pack', 140, '🌾', 'available'],
      ['Organic Honey', 'Raw pure wildflower organic honey in an artisanal glass jar', 399, 'Snacks', 'jar', 85, '🍯', 'available'],
      ['Fresh Avocados', 'Creamy Hass avocados, ripe and ready for guacamole or toast', 199, 'Fruits', 'pack', 110, '🥑', 'available'],
      ['Baby Spinach', 'Crisp organic tender baby spinach leaves, pre-washed & salad ready', 49, 'Vegetables', 'pack', 120, '🥬', 'available'],
      ['Almond Milk', 'Smooth unsweetened dairy-free almond milk, enriched with vitamins', 180, 'Dairy', 'liter', 140, '🥛', 'available'],
      ['Cold Brew Coffee', 'Smooth steeped artisanal cold brew iced coffee bottle', 160, 'Beverages', 'bottle', 0, '🧋', 'coming_soon']
    ];

    for (const p of defaultProducts) {
      db.run(
        'INSERT INTO products (name, description, price, category, unit, stock, emoji, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log(`🌾 Automatically seeded ${defaultProducts.length} default products!`);
  }

  // Mark a couple of products as Sold Out and Coming Soon for immediate demonstration
  try {
    db.run("UPDATE products SET status = 'sold_out', stock = 0 WHERE name = 'Strawberries'");
    db.run("UPDATE products SET status = 'coming_soon', stock = 0 WHERE name = 'Cold Brew Coffee'");
  } catch (e) {}

  db.run('PRAGMA foreign_keys = ON');

  saveDatabase();
  console.log('✅ Database initialized successfully!');
  return db;
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// Helper: run a query that returns rows (SELECT)
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query that returns a single row
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a statement (INSERT, UPDATE, DELETE)
export function execute(sql, params = [], autoSave = true) {
  db.run(sql, params);
  const result = {
    lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0],
    changes: db.getRowsModified()
  };
  if (autoSave) saveDatabase();
  return result;
}

// Helper: run multiple statements in a transaction
export function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    // Override execute to not save during transaction
    const origExecute = execute;
    const result = fn((sql, params = []) => {
      db.run(sql, params);
      return {
        lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0],
        changes: db.getRowsModified()
      };
    });
    db.run('COMMIT');
    saveDatabase();
    return result;
  } catch (err) {
    try { db.run('ROLLBACK'); } catch (e) { /* already rolled back */ }
    throw err;
  }
}

export function getDb() {
  return db;
}

export default { initDatabase, queryAll, queryOne, execute, transaction, saveDatabase, getDb };
