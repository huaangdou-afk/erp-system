const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db/database');

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

async function getOrders(db, status) {
  let sql = `
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND po.status = ?'; params.push(status); }
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

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await getOrders(db, req.query.status);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { supplier_id, items } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: '供应商和商品必填' });
    }

    // Verify supplier
    const supStmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    supStmt.bind([supplier_id]);
    if (!supStmt.step()) {
      supStmt.free();
      return res.status(400).json({ success: false, message: '供应商不存在' });
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
        throw new Error(`商品ID ${item.product_id} 不存在`);
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
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/purchases/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM purchase_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '采购单不存在' }); }
    check.free();

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效状态' });
    }

    db.run('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
    saveDb();
    const order = await getOrderById(db, id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM purchase_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '采购单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的采购单不可删除' });
    }

    db.run('DELETE FROM purchase_items WHERE order_id = ?', [id]);
    db.run('DELETE FROM purchase_orders WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
