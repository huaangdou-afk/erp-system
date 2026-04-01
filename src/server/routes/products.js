const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getDb, saveDb } = require('../db/database');
const validate = require('../middleware/validate');

// Validation rules
const createProductRules = [
  body('code').trim().notEmpty().withMessage('编码不能为空'),
  body('name').trim().notEmpty().withMessage('名称不能为空'),
  body('purchase_price').optional().isFloat({ min: 0 }).withMessage('采购价格必须为非负数字'),
  body('sale_price').optional().isFloat({ min: 0 }).withMessage('销售价格必须为非负数字'),
  body('stock').optional().isInt({ min: 0 }).withMessage('库存必须为非负整数'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('最低库存必须为非负整数'),
];

const updateProductRules = [
  body('name').optional().trim().notEmpty().withMessage('名称不能为空'),
  body('purchase_price').optional().isFloat({ min: 0 }).withMessage('采购价格必须为非负数字'),
  body('sale_price').optional().isFloat({ min: 0 }).withMessage('销售价格必须为非负数字'),
  body('stock').optional().isInt({ min: 0 }).withMessage('库存必须为非负整数'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('最低库存必须为非负整数'),
];

// GET /api/products
router.get('/', async (req, res, next) => {
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
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    stmt.bind([Number(req.params.id)]);
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ success: false, error: '商品不存在' });
    }
    const product = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', createProductRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;

    const check = db.prepare('SELECT id FROM products WHERE code = ?');
    check.bind([code]);
    if (check.step()) {
      check.free();
      return res.status(400).json({ success: false, error: '编码已存在', details: [{ field: 'code', message: '该编码已被使用' }] });
    }
    check.free();

    db.run(
      `INSERT INTO products (code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, spec || '', unit || '个', category || '', purchase_price || 0, sale_price || 0, stock || 0, min_stock || 0]
    );
    saveDb();

    // Re-query by code to get the full inserted product
    const stmt = db.prepare('SELECT * FROM products WHERE code = ?');
    stmt.bind([code]);
    stmt.step();
    const product = stmt.getAsObject();
    stmt.free();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', updateProductRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;

    const check = db.prepare('SELECT * FROM products WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) {
      check.free();
      return res.status(404).json({ success: false, error: '商品不存在' });
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
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const check = db.prepare('SELECT * FROM products WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) {
      check.free();
      return res.status(404).json({ success: false, error: '商品不存在' });
    }
    check.free();

    db.run('DELETE FROM products WHERE id = ?', [Number(req.params.id)]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
