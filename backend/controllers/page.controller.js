import { queryOne, queryAll } from '../db/database.js';

export function getPageBySlug(req, res) {
  try {
    const { slug } = req.params;
    const page = queryOne('SELECT * FROM pages WHERE slug = ?', [slug]);
    if (!page) {
      return res.status(404).json({ error: 'Page not found.' });
    }
    res.json({ page });
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ error: 'Failed to load page content.' });
  }
}

export function getAllPages(req, res) {
  try {
    const pages = queryAll('SELECT slug, title, updated_at FROM pages');
    res.json({ pages });
  } catch (err) {
    console.error('Get all pages error:', err);
    res.status(500).json({ error: 'Failed to load pages list.' });
  }
}
