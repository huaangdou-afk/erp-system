const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// 列表
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT po.*, s.name as supplier_name 
             FROM purchase_orders po 
             LEFT JOIN suppliers s ON po.supplier_id = s.id 
             WHERE 1=1`;
  const params = [];
  
  if (status) {
    sql += ' AND po.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY po.created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  
  // 附加明细
  for (const order of orders) {
    const items = db.prepare(`
      SELECT pi.*, p.name as product_name, p.code as product_code, p.unit
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.order_id = ?
    `).all(order.id);
    order.items = items;
  }
  
  res.json({ success: true, data: orders });
});

// 创建采购单（含入库）
router.post('/', (req, res) => {
  const { supplier_id, items } = req.body;
  
  if (!supplier_id || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: '供应商和商品必填' });
  }
  
  // 验证供应商
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplier_id);
  if (!supplier) {
    return res.status(400).json({ success: false, message: '供应商不存在' });
  }
  
  // 计算总金额
  let total_amount = 0;
  for (const item of items) {
    total_amount += item.quantity * item.unit_price;
  }
  
  // 生成单号
  const order_no = 'PO' + Date.now().toString().slice(-10);
  
  const insertOrder = db.prepare(`
    INSERT INTO purchase_orders (order_no, supplier_id, total_amount, status)
    VALUES (?, ?, ?, 'completed')
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO purchase_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const updateStock = db.prepare(`
    UPDATE products SET stock = stock + ? WHERE id = ?
  `);
  
  const transaction = db.transaction(() => {
    const result = insertOrder.run(order_no, supplier_id, total_amount);
    const order_id = result.lastInsertRowid;
    
    for (const item of items) {
      // 验证商品
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`商品ID ${item.product_id} 不存在`);
      
      const subtotal = item.quantity * item.unit_price;
      insertItem.run(order_id, item.product_id, item.quantity, item.unit_price, subtotal);
      
      // 入库：增加库存
      updateStock.run(item.quantity, item.product_id);
    }
    
    return order_id;
  });
  
  try {
    const order_id = transaction();
    const order = db.prepare(`
      SELECT po.*, s.name as supplier_name 
      FROM purchase_orders po 
      LEFT JOIN suppliers s ON po.supplier_id = s.id 
      WHERE po.id = ?
    `).get(order_id);
    
    const items = db.prepare(`
      SELECT pi.*, p.name as product_name, p.code as product_code, p.unit
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.order_id = ?
    `).all(order_id);
    
    order.items = items;
    
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 更新状态
router.put('/:id', (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
  
  if (!order) return res.status(404).json({ success: false, message: '采购单不存在' });
  
  if (!['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: '无效状态' });
  }
  
  db.prepare('UPDATE purchase_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  
  const updated = db.prepare(`
    SELECT po.*, s.name as supplier_name 
    FROM purchase_orders po 
    LEFT JOIN suppliers s ON po.supplier_id = s.id 
    WHERE po.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updated });
});

// 删除（仅pending状态可删）
router.delete('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
  
  if (!order) return res.status(404).json({ success: false, message: '采购单不存在' });
  
  if (order.status === 'completed') {
    return res.status(400).json({ success: false, message: '已完成的采购单不可删除' });
  }
  
  db.prepare('DELETE FROM purchase_items WHERE order_id = ?').run(req.params.id);
  db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
  
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
