import jwt from 'jsonwebtoken';
import { queryAll, queryOne, execute } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

export function adminAuth(req, res, next) {
  const token = 
    req.cookies?.grocery_admin_token || 
    req.cookies?.admin_token || 
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired admin session. Please log in again.' });
  }
}

export function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const currentUsername = queryOne("SELECT value FROM admin_settings WHERE key = 'username'")?.value || 'admin';
    const currentPassword = queryOne("SELECT value FROM admin_settings WHERE key = 'password'")?.value || 'admin123';
    const currentEmail = queryOne("SELECT value FROM admin_settings WHERE key = 'email'")?.value || 'admin@freshmart.in';

    const matchUsername = (username.trim().toLowerCase() === currentUsername.toLowerCase() || username.trim().toLowerCase() === currentEmail.toLowerCase());
    const matchPassword = (password === currentPassword);

    if (!matchUsername || !matchPassword) {
      return res.status(401).json({ error: 'Invalid admin username or password.' });
    }

    const token = jwt.sign({ role: 'admin', username: currentUsername }, JWT_SECRET, { expiresIn: '1d' });

    // Set secure httpOnly cookie for admin
    res.cookie('grocery_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      message: 'Admin authentication successful!',
      token,
      admin: { username: currentUsername, email: currentEmail }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed.' });
  }
}

export function adminLogout(req, res) {
  try {
    res.clearCookie('grocery_admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Admin logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to logout admin.' });
  }
}

export function getAdminSettings(req, res) {
  try {
    const username = queryOne("SELECT value FROM admin_settings WHERE key = 'username'")?.value || 'admin';
    const email = queryOne("SELECT value FROM admin_settings WHERE key = 'email'")?.value || 'admin@freshmart.in';
    const isDefault = (username === 'admin');

    res.json({ username, email, isDefault });
  } catch (err) {
    console.error('Get admin settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin settings.' });
  }
}

export function updateAdminSettings(req, res) {
  try {
    const { username, password, email } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Admin username is required.' });
    }

    execute("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('username', ?)", [username.trim()]);
    
    if (email) {
      execute("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('email', ?)", [email.trim()]);
    }

    if (password && password.trim().length >= 6) {
      execute("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('password', ?)", [password.trim()]);
    }

    res.json({ message: 'Admin credentials updated successfully!' });
  } catch (err) {
    console.error('Update admin settings error:', err);
    res.status(500).json({ error: 'Failed to update admin credentials.' });
  }
}

export function updateProductStock(req, res) {
  try {
    const { id } = req.params;
    const { stock, status, price } = req.body;

    const product = queryOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const newStock = stock !== undefined ? parseInt(stock) : product.stock;
    let newStatus = status || product.status || 'available';

    // If stock is set to 0 and not explicitly coming_soon, mark as sold_out
    if (newStock === 0 && newStatus !== 'coming_soon') {
      newStatus = 'sold_out';
    } else if (newStock > 0 && newStatus === 'sold_out') {
      newStatus = 'available';
    }

    const newPrice = price !== undefined ? parseFloat(price) : product.price;

    execute(
      'UPDATE products SET stock = ?, status = ?, price = ? WHERE id = ?',
      [newStock, newStatus, newPrice, parseInt(id)]
    );

    const updated = queryOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    res.json({ message: 'Product updated successfully!', product: updated });
  } catch (err) {
    console.error('Update product stock error:', err);
    res.status(500).json({ error: 'Failed to update product stock.' });
  }
}

export function getDashboard(req, res) {
  try {
    const users = queryAll(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at,
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.total), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const orders = queryAll(`
      SELECT o.*, u.name as user_name, u.email as user_email, COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const products = queryAll('SELECT * FROM products ORDER BY category, name');
    const feedbacks = queryAll('SELECT * FROM feedbacks ORDER BY created_at DESC');

    const stats = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      totalProducts: products.length,
      totalFeedbacks: feedbacks.length,
      lowStockProducts: products.filter(p => p.stock < 20 && p.status === 'available').length,
      soldOutProducts: products.filter(p => p.status === 'sold_out' || p.stock === 0).length,
      comingSoonProducts: products.filter(p => p.status === 'coming_soon').length,
    };

    res.json({ stats, users, orders, products, feedbacks });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load admin data.' });
  }
}

export function addProduct(req, res) {
  try {
    const { name, category, price, old_price, unit, emoji, stock, status, description } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Product name, category, and price are required.' });
    }

    const prodPrice = parseFloat(price);
    const prodOldPrice = old_price ? parseFloat(old_price) : null;
    const prodStock = stock !== undefined ? parseInt(stock) : 50;
    const prodStatus = status || (prodStock === 0 ? 'sold_out' : 'available');
    const prodUnit = unit || '1 kg';
    const prodEmoji = emoji || '🍎';
    const prodDesc = description || '';

    const result = execute(
      `INSERT INTO products (name, category, price, old_price, unit, emoji, stock, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), category.trim(), prodPrice, prodOldPrice, prodUnit.trim(), prodEmoji.trim(), prodStock, prodStatus, prodDesc.trim()]
    );

    const newProduct = queryOne('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Product added successfully!', product: newProduct });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'Failed to add product.' });
  }
}

export function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const product = queryOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    execute('DELETE FROM products WHERE id = ?', [parseInt(id)]);
    res.json({ message: `Product "${product.name}" deleted successfully.` });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

export function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [parseInt(id)]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    execute('UPDATE orders SET status = ? WHERE id = ?', [status.trim(), parseInt(id)]);
    const updated = queryOne('SELECT * FROM orders WHERE id = ?', [parseInt(id)]);
    res.json({ message: 'Order status updated successfully!', order: updated });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
}

export function getOrderDetails(req, res) {
  try {
    const order = queryAll(`
      SELECT oi.*, p.name, p.emoji, p.unit, p.category
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [parseInt(req.params.id)]);
    res.json({ items: order });
  } catch (err) {
    console.error('Admin order details error:', err);
    res.status(500).json({ error: 'Failed to load order details.' });
  }
}
