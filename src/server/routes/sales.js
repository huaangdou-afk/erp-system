const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getDb, saveDb } = require('../db/database');
const validate = require('../middleware/validate');

async function getOrderById(db, id) {
  const stmt = db.prepare(`
    SELECT so.*, c.name as customer_name
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE so.id = ?
  `);
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); return null; }
  const order = stmt.getAsObject();
  stmt.free();

  const itemsStmt = db.prepare(`
    SELECT si.*, p.name as product_name, p.code as product_code, p.unit
    FROM sales_items si
    LEFT JOIN products p ON si.product_id = p.id
    WHERE si.order_id = ?
  `);
  itemsStmt.bind([id]);
  const items = [];
  while (itemsStmt.step()) items.push(itemsStmt.getAsObject());
  itemsStmt.free();
  order.items = items;
  return order;
}

async function getOrders(db, filters = {}) {
  const { status, start_date, end_date } = filters;
  let sql = `
    SELECT so.*, c.name as customer_name
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND so.status = ?'; params.push(status); }
  if (start_date) { sql += ' AND date(so.created_at) >= ?'; params.push(start_date); }
  if (end_date) { sql += ' AND date(so.created_at) <= ?'; params.push(end_date); }
  sql += ' ORDER BY so.created_at DESC';

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const orders = [];
  while (stmt.step()) orders.push(stmt.getAsObject());
  stmt.free();

  for (const order of orders) {
    const itemsStmt = db.prepare(`
      SELECT si.*, p.name as product_name, p.code as product_code, p.unit
      FROM sales_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.order_id = ?
    `);
    itemsStmt.bind([order.id]);
    const items = [];
    while (itemsStmt.step()) items.push(itemsStmt.getAsObject());
    itemsStmt.free();
    order.items = items;
  }
  return orders;
}

// Validation rules
const createSalesRules = [
  body('customer_id').notEmpty().withMessage('客户ID不能为空').isInt({ min: 1 }).withMessage('客户ID必须是正整数'),
  body('items').isArray({ min: 1 }).withMessage('商品列表不能为空'),
  body('items.*.product_id').notEmpty().isInt({ min: 1 }).withMessage('商品ID无效'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('数量必须为正整数'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('单价必须为非负数'),
];

// GET /api/sales
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { status, start_date, end_date } = req.query;
    const orders = await getOrders(db, { status, start_date, end_date });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// POST /api/sales
router.post('/', createSalesRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { customer_id, items } = req.body;

    // Verify customer
    const custStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    custStmt.bind([customer_id]);
    if (!custStmt.step()) {
      custStmt.free();
      return res.status(400).json({ success: false, error: '客户不存在' });
    }
    custStmt.free();

    // Check stock
    for (const item of items) {
      const prodStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      prodStmt.bind([item.product_id]);
      if (!prodStmt.step()) {
        prodStmt.free();
        return res.status(400).json({ success: false, error: `商品ID ${item.product_id} 不存在` });
      }
      const product = prodStmt.getAsObject();
      prodStmt.free();
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `商品【${product.name}】库存不足，当前库存 ${product.stock}，需要 ${item.quantity}`,
        });
      }
    }

    let total_amount = 0;
    for (const item of items) total_amount += item.quantity * item.unit_price;
    const order_no = 'SO' + Date.now().toString().slice(-10);

    db.run(
      `INSERT INTO sales_orders (order_no, customer_id, total_amount, status) VALUES (?, ?, ?, 'completed')`,
      [order_no, customer_id, total_amount]
    );
    const newIdResult = db.exec('SELECT last_insert_rowid() as id');
    const order_id = newIdResult[0].values[0][0];

    for (const item of items) {
      const prodStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      prodStmt.bind([item.product_id]);
      prodStmt.step();
      const product = prodStmt.getAsObject();
      prodStmt.free();

      const subtotal = item.quantity * item.unit_price;
      db.run(
        `INSERT INTO sales_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.product_id]);
    }

    saveDb();
    const order = await getOrderById(db, order_id);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sales/:id
router.put('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM sales_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '销售单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效状态' });
    }

    if (order.status === 'completed' && status === 'cancelled') {
      const itemsStmt = db.prepare('SELECT * FROM sales_items WHERE order_id = ?');
      itemsStmt.bind([id]);
      while (itemsStmt.step()) {
        const item = itemsStmt.getAsObject();
        db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      itemsStmt.free();
    }

    db.run('UPDATE sales_orders SET status = ? WHERE id = ?', [status, id]);
    saveDb();
    const updated = await getOrderById(db, id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM sales_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '销售单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, error: '已完成的销售单不可删除' });
    }

    db.run('DELETE FROM sales_items WHERE order_id = ?', [id]);
    db.run('DELETE FROM sales_orders WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
