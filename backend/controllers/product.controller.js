import { queryAll, queryOne } from '../db/database.js';

export function getAllProducts(req, res) {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      params.push(term, term, term);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category, name';

    const products = queryAll(query, params);
    res.json({ products });
  } catch (err) {
    console.error('GetAllProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

export function getProductById(req, res) {
  try {
    const product = queryOne('SELECT * FROM products WHERE id = ?', [parseInt(req.params.id)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    console.error('GetProductById error:', err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
}
