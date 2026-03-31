const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT id, code, name, spec, unit, category,
             stock, min_stock, purchase_price, sale_price, created_at
      FROM products
      ORDER BY name ASC
    `);
    const products = [];
    while (stmt.step()) products.push(stmt.getAsObject());
    stmt.free();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT id, code, name, spec, unit, category,
             stock, min_stock, purchase_price, sale_price, created_at
      FROM products
      WHERE stock < min_stock AND min_stock > 0
      ORDER BY (min_stock - stock) DESC
    `);
    const products = [];
    while (stmt.step()) products.push(stmt.getAsObject());
    stmt.free();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
