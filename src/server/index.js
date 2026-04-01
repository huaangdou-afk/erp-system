const express = require('express');
const cors = require('cors');
const { initDb, getDb } = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const productsRouter = require('./routes/products');
const suppliersRouter = require('./routes/suppliers');
const customersRouter = require('./routes/customers');
const purchasesRouter = require('./routes/purchases');
const salesRouter = require('./routes/sales');
const inventoryRouter = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/inventory', inventoryRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SimpleERP server is running' });
});

// GET /api/stats - Dashboard statistics
app.get('/api/stats', async (req, res, next) => {
  try {
    const db = await getDb();

    const totalProducts = db.exec('SELECT COUNT(*) as count FROM products')[0].values[0][0];
    const totalSuppliers = db.exec('SELECT COUNT(*) as count FROM suppliers')[0].values[0][0];
    const totalCustomers = db.exec('SELECT COUNT(*) as count FROM customers')[0].values[0][0];

    const salesResult = db.exec("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_orders WHERE status = 'completed'");
    const totalSalesAmount = salesResult[0].values[0][0];

    const purchasesResult = db.exec("SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders WHERE status = 'completed'");
    const totalPurchasesAmount = purchasesResult[0].values[0][0];

    const lowStockResult = db.exec('SELECT COUNT(*) as count FROM products WHERE stock < min_stock AND min_stock > 0');
    const lowStockCount = lowStockResult[0].values[0][0];

    const recentSalesStmt = db.prepare(`
      SELECT so.id, so.order_no, so.total_amount, so.status, so.created_at,
             c.name as customer_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.status = 'completed'
      ORDER BY so.created_at DESC
      LIMIT 10
    `);
    const recentSales = [];
    while (recentSalesStmt.step()) recentSales.push(recentSalesStmt.getAsObject());
    recentSalesStmt.free();

    res.json({
      success: true,
      data: {
        total_products: totalProducts,
        total_suppliers: totalSuppliers,
        total_customers: totalCustomers,
        total_sales_amount: totalSalesAmount,
        total_purchases_amount: totalPurchasesAmount,
        low_stock_count: lowStockCount,
        recent_sales: recentSales,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Centralized error handler (must be last)
app.use(errorHandler);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SimpleERP server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
