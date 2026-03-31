const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 列表
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM suppliers WHERE 1=1';
  const params = [];
  
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  const suppliers = db.prepare(sql).all(...params);
  res.json({ success: true, data: suppliers });
});

// 新增
router.post('/', (req, res) => {
  const { code, name, contact, phone, address } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ success: false, message: '编码和名称必填' });
  }
  
  const existing = db.prepare('SELECT id FROM suppliers WHERE code = ?').get(code);
  if (existing) {
    return res.status(400).json({ success: false, message: '编码已存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO suppliers (code, name, contact, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(code, name, contact || '', phone || '', address || '');
  
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: supplier });
});

// 更新
router.put('/:id', (req, res) => {
  const { name, contact, phone, address } = req.body;
  
  const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '供应商不存在' });
  
  db.prepare(`UPDATE suppliers SET name=?, contact=?, phone=?, address=? WHERE id=?`)
    .run(name, contact, phone, address, req.params.id);
  
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: supplier });
});

// 删除
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '供应商不存在' });
  
  // 检查是否有采购单引用
  const ref = db.prepare('SELECT id FROM purchase_orders WHERE supplier_id = ? LIMIT 1').get(req.params.id);
  if (ref) {
    return res.status(400).json({ success: false, message: '该供应商有采购单关联，无法删除' });
  }
  
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
