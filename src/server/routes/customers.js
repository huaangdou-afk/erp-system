const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 列表
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  const customers = db.prepare(sql).all(...params);
  res.json({ success: true, data: customers });
});

// 新增
router.post('/', (req, res) => {
  const { code, name, contact, phone, address } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ success: false, message: '编码和名称必填' });
  }
  
  const existing = db.prepare('SELECT id FROM customers WHERE code = ?').get(code);
  if (existing) {
    return res.status(400).json({ success: false, message: '编码已存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO customers (code, name, contact, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(code, name, contact || '', phone || '', address || '');
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: customer });
});

// 更新
router.put('/:id', (req, res) => {
  const { name, contact, phone, address } = req.body;
  
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '客户不存在' });
  
  db.prepare(`UPDATE customers SET name=?, contact=?, phone=?, address=? WHERE id=?`)
    .run(name, contact, phone, address, req.params.id);
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: customer });
});

// 删除
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '客户不存在' });
  
  const ref = db.prepare('SELECT id FROM sales_orders WHERE customer_id = ? LIMIT 1').get(req.params.id);
  if (ref) {
    return res.status(400).json({ success: false, message: '该客户有销售单关联，无法删除' });
  }
  
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
