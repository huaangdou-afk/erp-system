const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db/database');

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { search } = req.query;
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const suppliers = [];
    while (stmt.step()) suppliers.push(stmt.getAsObject());
    stmt.free();
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { code, name, contact, phone, address } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: '编码和名称必填' });
    }

    const check = db.prepare('SELECT id FROM suppliers WHERE code = ?');
    check.bind([code]);
    if (check.step()) { check.free(); return res.status(400).json({ success: false, message: '编码已存在' }); }
    check.free();

    db.run(
      `INSERT INTO suppliers (code, name, contact, phone, address) VALUES (?, ?, ?, ?, ?)`,
      [code, name, contact || '', phone || '', address || '']
    );
    saveDb();

    const newId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    stmt.bind([newId]);
    stmt.step();
    const supplier = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, contact, phone, address } = req.body;

    const check = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    check.bind([Number(req.params.id)]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '供应商不存在' }); }
    check.free();

    db.run(`UPDATE suppliers SET name=?, contact=?, phone=?, address=? WHERE id=?`,
      [name, contact, phone, address, Number(req.params.id)]);
    saveDb();

    const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    stmt.bind([Number(req.params.id)]);
    stmt.step();
    const supplier = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const check = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    check.bind([id]);
    if (!check.step()) { check.free(); return res.status(404).json({ success: false, message: '供应商不存在' }); }
    check.free();

    const ref = db.prepare('SELECT id FROM purchase_orders WHERE supplier_id = ? LIMIT 1');
    ref.bind([id]);
    if (ref.step()) { ref.free(); return res.status(400).json({ success: false, message: '该供应商有采购单关联，无法删除' }); }
    ref.free();

    db.run('DELETE FROM suppliers WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
