const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getDb, saveDb } = require('../db/database');
const validate = require('../middleware/validate');

async function getOrderById(db, id) {
  const stmt = db.prepare(`
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `);
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); return null; }
  const order = stmt.getAsObject();
  stmt.free();

  const itemsStmt = db.prepare(`
    SELECT pi.*, p.name as product_name, p.code as product_code, p.unit
    FROM purchase_items pi
    LEFT JOIN products p ON pi.product_id = p.id
    WHERE pi.order_id = ?
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
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND po.status = ?'; params.push(status); }
  if (start_date) { sql += ' AND date(po.created_at) >= ?'; params.push(start_date); }
  if (end_date) { sql += ' AND date(po.created_at) <= ?'; params.push(end_date); }
  sql += ' ORDER BY po.created_at DESC';

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const orders = [];
  while (stmt.step()) orders.push(stmt.getAsObject());
  stmt.free();

  for (const order of orders) {
    const itemsStmt = db.prepare(`
      SELECT pi.*, p.name as product_name, p.code as product_code, p.unit
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.order_id = ?
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
const createPurchaseRules = [
  body('supplier_id').notEmpty().withMessage('供应商ID不能为空').isInt({ min: 1 }).withMessage('供应商ID必须是正整数'),
  body('items').isArray({ min: 1 }).withMessage('商品列表不能为空'),
  body('items.*.product_id').notEmpty().isInt({ min: 1 }).withMessage('商品ID无效'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('数量必须为正整数'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('单价必须为非负数'),
];

// GET /api/purchases
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

// POST /api/purchases
router.post('/', createPurchaseRules, validate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { supplier_id, items } = req.body;

    // Verify supplier
    const supStmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    supStmt.bind([supplier_id]);
    if (!supStmt.step()) {
      supStmt.free();
      return res.status(400).json({ success: false, error: '供应商不存在' });
    }
    supStmt.free();

    let total_amount = 0;
    for (const item of items) total_amount += item.quantity * item.unit_price;
    const order_no = 'PO' + Date.now().toString().slice(-10);

    db.run(
      `INSERT INTO purchase_orders (order_no, supplier_id, total_amount, status) VALUES (?, ?, ?, 'completed')`,
      [order_no, supplier_id, total_amount]
    );
    const newIdResult = db.exec('SELECT last_insert_rowid() as id');
    const order_id = newIdResult[0].values[0][0];

    for (const item of items) {
      const prodStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      prodStmt.bind([item.product_id]);
      if (!prodStmt.step()) {
        prodStmt.free();
        throw Object.assign(new Error(`商品ID ${item.product_id} 不存在`), { status: 400 });
      }
      prodStmt.free();

      const subtotal = item.quantity * item.unit_price;
      db.run(
        `INSERT INTO purchase_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
    }

    saveDb();
    const order = await getOrderById(db, order_id);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/purchases/:id
router.put('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM purchase_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '采购单不存在' }); }
    check.free();

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效状态' });
    }

    db.run('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
    saveDb();
    const order = await getOrderById(db, id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM purchase_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, error: '采购单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, error: '已完成的采购单不可删除' });
    }

    db.run('DELETE FROM purchase_items WHERE order_id = ?', [id]);
    db.run('DELETE FROM purchase_orders WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
