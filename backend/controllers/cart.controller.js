import { queryAll, queryOne, execute } from '../db/database.js';

export function getCart(req, res) {
  try {
    const items = queryAll(`
      SELECT ci.id, ci.quantity, ci.product_id, p.name, p.price, p.emoji, p.unit, p.stock, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.id DESC
    `, [req.userId]);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    console.error('GetCart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
}

export function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const product = queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    const existing = queryOne('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, productId]);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ error: 'Cannot add more than available stock.' });
      }
      execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.userId, productId, quantity]);
    }

    res.status(201).json({ message: 'Item added to cart!' });
  } catch (err) {
    console.error('AddToCart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
}

export function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    const id = parseInt(req.params.id);

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const item = queryOne(`
      SELECT ci.*, p.stock FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.id = ? AND ci.user_id = ?
    `, [id, req.userId]);
    
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    if (quantity > item.stock) {
      return res.status(400).json({ error: 'Cannot exceed available stock.' });
    }

    execute('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, id, req.userId]);
    res.json({ message: 'Cart updated!' });
  } catch (err) {
    console.error('UpdateCartItem error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
}

export function removeCartItem(req, res) {
  try {
    const result = execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('RemoveCartItem error:', err);
    res.status(500).json({ error: 'Failed to remove item.' });
  }
}

export function clearCart(req, res) {
  try {
    execute('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);
    res.json({ message: 'Cart cleared.' });
  } catch (err) {
    console.error('ClearCart error:', err);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
}
