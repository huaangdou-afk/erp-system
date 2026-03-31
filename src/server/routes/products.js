const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db/database');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { search, category } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const products = [];
    while (stmt.step()) products.push(stmt.getAsObject());
    stmt.free();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    stmt.bind([Number(req.params.id)]);
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    const product = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: '编码和名称必填' });
    }

    const check = db.prepare('SELECT id FROM products WHERE code = ?');
    check.bind([code]);
    if (check.step()) {
      check.free();
      return res.status(400).json({ success: false, message: '编码已存在' });
    }
    check.free();

    db.run(
      `INSERT INTO products (code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, spec || '', unit || '个', category || '', purchase_price || 0, sale_price || 0, stock || 0, min_stock || 0]
    );
    saveDb();

    const newId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    stmt.bind([newId]);
    stmt.step();
    const product = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;

    const check = db.prepare('SELECT * FROM products WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) {
      check.free();
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    check.free();

    db.run(
      `UPDATE products SET name=?, spec=?, unit=?, category=?, purchase_price=?, sale_price=?, stock=?, min_stock=? WHERE id=?`,
      [name, spec, unit, category, purchase_price, sale_price, stock, min_stock, Number(req.params.id)]
    );
    saveDb();

    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    stmt.bind([Number(req.params.id)]);
    stmt.step();
    const product = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const check = db.prepare('SELECT * FROM products WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) {
      check.free();
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    check.free();

    db.run('DELETE FROM products WHERE id = ?', [Number(req.params.id)]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
