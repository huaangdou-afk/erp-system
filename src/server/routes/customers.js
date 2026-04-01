const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getDb, saveDb } = require('../db/database');
const validate = require('../middleware/validate');

// Validation rules
const createCustomerRules = [
  body('code').trim().notEmpty().withMessage('编码不能为空'),
  body('name').trim().notEmpty().withMessage('名称不能为空'),
  body('phone').optional().matches(/^[\d\-\s\+]+$/).withMessage('电话号码格式不正确'),
];

const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('名称不能为空'),
  body('phone').optional().matches(/^[\d\-\s\+]+$/).withMessage('电话号码格式不正确'),
];

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const customers = [];
    while (stmt.step()) customers.push(stmt.getAsObject());
    stmt.free();
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers
router.post('/', createCustomerRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { code, name, contact, phone, address } = req.body;

    const check = db.prepare('SELECT id FROM customers WHERE code = ?');
    check.bind([code]);
    if (check.step()) { check.free(); return res.status(400).json({ success: false, error: '编码已存在', details: [{ field: 'code', message: '该编码已被使用' }] }); }
    check.free();

    db.run(
      `INSERT INTO customers (code, name, contact, phone, address) VALUES (?, ?, ?, ?, ?)`,
      [code, name, contact || '', phone || '', address || '']
    );
    saveDb();

    const newId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    stmt.bind([newId]);
    stmt.step();
    const customer = stmt.getAsObject();
    stmt.free();
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id
router.put('/:id', updateCustomerRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, contact, phone, address } = req.body;

    const check = db.prepare('SELECT * FROM customers WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '客户不存在' }); }
    check.free();

    db.run(`UPDATE customers SET name=?, contact=?, phone=?, address=? WHERE id=?`,
      [name, contact, phone, address, Number(req.params.id)]);
    saveDb();

    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    stmt.bind([Number(req.params.id)]);
    stmt.step();
    const customer = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM customers WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '客户不存在' }); }
    check.free();

    const ref = db.prepare('SELECT id FROM sales_orders WHERE customer_id = ? LIMIT 1');
    ref.bind([id]);
    if (ref.step()) { ref.free(); return res.status(400).json({ success: false, error: '该客户有销售单关联，无法删除' }); }
    ref.free();

    db.run('DELETE FROM customers WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
