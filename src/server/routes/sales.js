const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db/database');

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

async function getOrders(db, status) {
  let sql = `
    SELECT so.*, c.name as customer_name
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND so.status = ?'; params.push(status); }
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

// GET /api/sales
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await getOrders(db, req.query.status);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sales
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { customer_id, items } = req.body;

    if (!customer_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: '客户和商品必填' });
    }

    // Verify customer
    const custStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    custStmt.bind([customer_id]);
    if (!custStmt.step()) {
      custStmt.free();
      return res.status(400).json({ success: false, message: '客户不存在' });
    }
    custStmt.free();

    // Check stock
    for (const item of items) {
      const prodStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      prodStmt.bind([item.product_id]);
      if (!prodStmt.step()) {
        prodStmt.free();
        return res.status(400).json({ success: false, message: `商品ID ${item.product_id} 不存在` });
      }
      const product = prodStmt.getAsObject();
      prodStmt.free();
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `商品【${product.name}】库存不足，当前库存 ${product.stock}，需要 ${item.quantity}`,
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
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/sales/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM sales_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '销售单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效状态' });
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
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM sales_orders WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '销售单不存在' }); }
    const order = check.getAsObject();
    check.free();

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的销售单不可删除' });
    }

    db.run('DELETE FROM sales_items WHERE order_id = ?', [id]);
    db.run('DELETE FROM sales_orders WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
