import { queryAll, queryOne, execute, transaction } from '../db/database.js';

export function placeOrder(req, res) {
  try {
    const { address, phone, paymentMethod, payment_method } = req.body;
    const method = paymentMethod || payment_method || 'Credit Card';

    if (!address) {
      return res.status(400).json({ error: 'Delivery address is required.' });
    }

    const cartItems = queryAll(`
      SELECT ci.*, p.price, p.name, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}.` });
      }
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total > 25 ? 0 : 3.99;
    const grandTotal = Math.round((total + deliveryFee) * 100) / 100;

    const orderId = transaction((exec) => {
      const orderResult = exec(
        'INSERT INTO orders (user_id, total, address, phone, payment_method) VALUES (?, ?, ?, ?, ?)',
        [req.userId, grandTotal, address, phone || '', method]
      );

      const oid = orderResult.lastInsertRowid;

      for (const item of cartItems) {
        exec(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [oid, item.product_id, item.quantity, item.price]
        );
        exec(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      exec('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);

      return oid;
    });

    res.status(201).json({
      message: 'Order placed successfully!',
      order: { id: orderId, total: grandTotal, status: 'confirmed', itemCount: cartItems.length, payment_method: method }
    });
  } catch (err) {
    console.error('PlaceOrder error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
}

export function getOrders(req, res) {
  try {
    const orders = queryAll(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.userId]);
    res.json({ orders });
  } catch (err) {
    console.error('GetOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

export function getOrderById(req, res) {
  try {
    const order = queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = queryAll(`
      SELECT oi.*, p.name, p.emoji, p.unit, p.category
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);

    res.json({ order: { ...order, items } });
  } catch (err) {
    console.error('GetOrderById error:', err);
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
}
