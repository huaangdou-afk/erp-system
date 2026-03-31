const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 列表
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT so.*, c.name as customer_name 
             FROM sales_orders so 
             LEFT JOIN customers c ON so.customer_id = c.id 
             WHERE 1=1`;
  const params = [];
  
  if (status) {
    sql += ' AND so.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY so.created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  
  for (const order of orders) {
    const items = db.prepare(`
      SELECT si.*, p.name as product_name, p.code as product_code, p.unit
      FROM sales_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.order_id = ?
    `).all(order.id);
    order.items = items;
  }
  
  res.json({ success: true, data: orders });
});

// 创建销售单（含出库）
router.post('/', (req, res) => {
  const { customer_id, items } = req.body;
  
  if (!customer_id || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: '客户和商品必填' });
  }
  
  // 验证客户
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(400).json({ success: false, message: '客户不存在' });
  }
  
  // 验证库存
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(400).json({ success: false, message: `商品ID ${item.product_id} 不存在` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `商品【${product.name}】库存不足，当前库存 ${product.stock}，需要 ${item.quantity}` 
      });
    }
  }
  
  // 计算总金额
  let total_amount = 0;
  for (const item of items) {
    total_amount += item.quantity * item.unit_price;
  }
  
  // 生成单号
  const order_no = 'SO' + Date.now().toString().slice(-10);
  
  const insertOrder = db.prepare(`
    INSERT INTO sales_orders (order_no, customer_id, total_amount, status)
    VALUES (?, ?, ?, 'completed')
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO sales_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const updateStock = db.prepare(`
    UPDATE products SET stock = stock - ? WHERE id = ?
  `);
  
  const transaction = db.transaction(() => {
    const result = insertOrder.run(order_no, customer_id, total_amount);
    const order_id = result.lastInsertRowid;
    
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      const subtotal = item.quantity * item.unit_price;
      insertItem.run(order_id, item.product_id, item.quantity, item.unit_price, subtotal);
      
      // 出库：扣减库存
      updateStock.run(item.quantity, item.product_id);
    }
    
    return order_id;
  });
  
  try {
    const order_id = transaction();
    const order = db.prepare(`
      SELECT so.*, c.name as customer_name 
      FROM sales_orders so 
      LEFT JOIN customers c ON so.customer_id = c.id 
      WHERE so.id = ?
    `).get(order_id);
    
    const items = db.prepare(`
      SELECT si.*, p.name as product_name, p.code as product_code, p.unit
      FROM sales_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.order_id = ?
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
  const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(req.params.id);
  
  if (!order) return res.status(404).json({ success: false, message: '销售单不存在' });
  
  if (!['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: '无效状态' });
  }
  
  // 如果取消已完成的销售单，需要退回库存
  if (order.status === 'completed' && status === 'cancelled') {
    const items = db.prepare('SELECT * FROM sales_items WHERE order_id = ?').all(order.id);
    const transaction = db.transaction(() => {
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
      }
      db.prepare('UPDATE sales_orders SET status = ? WHERE id = ?').run(status, req.params.id);
    });
    transaction();
  } else {
    db.prepare('UPDATE sales_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  
  const updated = db.prepare(`
    SELECT so.*, c.name as customer_name 
    FROM sales_orders so 
    LEFT JOIN customers c ON so.customer_id = c.id 
    WHERE so.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updated });
});

// 删除（仅pending状态可删）
router.delete('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(req.params.id);
  
  if (!order) return res.status(404).json({ success: false, message: '销售单不存在' });
  
  if (order.status === 'completed') {
    return res.status(400).json({ success: false, message: '已完成的销售单不可删除' });
  }
  
  db.prepare('DELETE FROM sales_items WHERE order_id = ?').run(req.params.id);
  db.prepare('DELETE FROM sales_orders WHERE id = ?').run(req.params.id);
  
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
