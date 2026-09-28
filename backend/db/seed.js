import { initDatabase, execute, transaction } from './database.js';

async function seed() {
  await initDatabase();

  // Clear existing products
  execute('DELETE FROM products');

  const products = [
    { name: 'Red Apples', description: 'Fresh and crispy red apples, perfect for snacking or baking', price: 3.49, category: 'Fruits', unit: 'kg', stock: 150, emoji: '🍎' },
    { name: 'Bananas', description: 'Ripe yellow bananas, rich in potassium and natural energy', price: 1.29, category: 'Fruits', unit: 'bunch', stock: 200, emoji: '🍌' },
    { name: 'Oranges', description: 'Juicy navel oranges bursting with vitamin C', price: 4.99, category: 'Fruits', unit: 'kg', stock: 120, emoji: '🍊' },
    { name: 'Strawberries', description: 'Sweet organic strawberries, hand-picked fresh daily', price: 5.99, category: 'Fruits', unit: 'pack', stock: 80, emoji: '🍓' },
    { name: 'Tomatoes', description: 'Vine-ripened tomatoes with rich flavor for salads and cooking', price: 2.99, category: 'Vegetables', unit: 'kg', stock: 180, emoji: '🍅' },
    { name: 'Potatoes', description: 'Premium russet potatoes, ideal for roasting and mashing', price: 1.99, category: 'Vegetables', unit: 'kg', stock: 250, emoji: '🥔' },
    { name: 'Onions', description: 'Fresh yellow onions, a kitchen essential for every meal', price: 1.49, category: 'Vegetables', unit: 'kg', stock: 300, emoji: '🧅' },
    { name: 'Broccoli', description: 'Tender green broccoli florets packed with nutrients', price: 3.29, category: 'Vegetables', unit: 'piece', stock: 100, emoji: '🥦' },
    { name: 'Whole Milk', description: 'Farm-fresh whole milk, creamy and delicious', price: 2.49, category: 'Dairy', unit: 'liter', stock: 200, emoji: '🥛' },
    { name: 'Cheddar Cheese', description: 'Aged sharp cheddar cheese with rich, bold flavor', price: 6.99, category: 'Dairy', unit: 'pack', stock: 90, emoji: '🧀' },
    { name: 'Greek Yogurt', description: 'Thick and creamy Greek yogurt, high in protein', price: 3.99, category: 'Dairy', unit: 'pack', stock: 150, emoji: '🥄' },
    { name: 'Butter', description: 'Unsalted premium butter for cooking and baking', price: 4.49, category: 'Dairy', unit: 'pack', stock: 120, emoji: '🧈' },
    { name: 'Sourdough Bread', description: 'Artisan sourdough bread with a crispy crust and soft center', price: 4.99, category: 'Bakery', unit: 'loaf', stock: 60, emoji: '🍞' },
    { name: 'Croissants', description: 'Flaky French butter croissants, baked fresh every morning', price: 3.49, category: 'Bakery', unit: 'pack', stock: 70, emoji: '🥐' },
    { name: 'Bagels', description: 'New York-style bagels, perfect for breakfast', price: 2.99, category: 'Bakery', unit: 'pack', stock: 80, emoji: '🥯' },
    { name: 'Blueberry Muffins', description: 'Soft and fluffy muffins loaded with fresh blueberries', price: 5.49, category: 'Bakery', unit: 'pack', stock: 50, emoji: '🧁' },
    { name: 'Orange Juice', description: 'Freshly squeezed 100% pure orange juice, no added sugar', price: 3.99, category: 'Beverages', unit: 'liter', stock: 130, emoji: '🧃' },
    { name: 'Sparkling Water', description: 'Naturally carbonated mineral water with a crisp taste', price: 1.99, category: 'Beverages', unit: 'pack', stock: 200, emoji: '💧' },
    { name: 'Green Tea', description: 'Premium Japanese green tea bags for a calming brew', price: 4.49, category: 'Beverages', unit: 'pack', stock: 100, emoji: '🍵' },
    { name: 'Ground Coffee', description: 'Rich Colombian ground coffee with bold, aromatic flavor', price: 8.99, category: 'Beverages', unit: 'pack', stock: 110, emoji: '☕' },
    { name: 'Potato Chips', description: 'Crispy sea salt potato chips, lightly salted', price: 2.99, category: 'Snacks', unit: 'pack', stock: 180, emoji: '🍟' },
    { name: 'Chocolate Cookies', description: 'Double chocolate chip cookies with a gooey center', price: 3.99, category: 'Snacks', unit: 'pack', stock: 120, emoji: '🍪' },
    { name: 'Roasted Almonds', description: 'Crunchy roasted almonds with a touch of sea salt', price: 7.99, category: 'Snacks', unit: 'pack', stock: 90, emoji: '🥜' },
    { name: 'Granola Bars', description: 'Wholesome oat and honey granola bars for on-the-go energy', price: 4.49, category: 'Snacks', unit: 'pack', stock: 140, emoji: '🌾' },
    { name: 'Organic Honey', description: 'Raw pure wildflower organic honey in an artisanal glass jar', price: 6.49, category: 'Snacks', unit: 'jar', stock: 85, emoji: '🍯' },
    { name: 'Fresh Avocados', description: 'Creamy Hass avocados, ripe and ready for guacamole or toast', price: 4.29, category: 'Fruits', unit: 'pack', stock: 110, emoji: '🥑' },
    { name: 'Baby Spinach', description: 'Crisp organic tender baby spinach leaves, pre-washed & salad ready', price: 2.79, category: 'Vegetables', unit: 'pack', stock: 120, emoji: '🥬' },
    { name: 'Almond Milk', description: 'Smooth unsweetened dairy-free almond milk, enriched with vitamins', price: 3.19, category: 'Dairy', unit: 'liter', stock: 140, emoji: '🥛' },
    { name: 'Cold Brew Coffee', description: 'Smooth steeped artisanal cold brew iced coffee bottle', price: 4.99, category: 'Beverages', unit: 'bottle', stock: 90, emoji: '🧋' },
  ];

  transaction((exec) => {
    for (const p of products) {
      exec(
        'INSERT INTO products (name, description, price, category, unit, stock, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.description, p.price, p.category, p.unit, p.stock, p.emoji]
      );
    }
  });

  console.log(`✅ Seeded ${products.length} products successfully!`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
