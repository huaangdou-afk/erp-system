const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 列表
router.get('/', (req, res) => {
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
  
  const products = db.prepare(sql).all(...params);
  res.json({ success: true, data: products });
});

// 详情
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: '商品不存在' });
  res.json({ success: true, data: product });
});

// 新增
router.post('/', (req, res) => {
  const { code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ success: false, message: '编码和名称必填' });
  }
  
  const existing = db.prepare('SELECT id FROM products WHERE code = ?').get(code);
  if (existing) {
    return res.status(400).json({ success: false, message: '编码已存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO products (code, name, spec, unit, category, purchase_price, sale_price, stock, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, spec || '', unit || '个', category || '', purchase_price || 0, sale_price || 0, stock || 0, min_stock || 0);
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: product });
});

// 更新
router.put('/:id', (req, res) => {
  const { name, spec, unit, category, purchase_price, sale_price, stock, min_stock } = req.body;
  
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '商品不存在' });
  
  db.prepare(`
    UPDATE products SET name=?, spec=?, unit=?, category=?, purchase_price=?, sale_price=?, stock=?, min_stock=?
    WHERE id=?
  `).run(name, spec, unit, category, purchase_price, sale_price, stock, min_stock, req.params.id);
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: product });
});

// 删除
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '商品不存在' });
  
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
