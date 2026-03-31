const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const productsRouter = require('./routes/products');
const suppliersRouter = require('./routes/suppliers');
const customersRouter = require('./routes/customers');
const purchasesRouter = require('./routes/purchases');
const salesRouter = require('./routes/sales');
const inventoryRouter = require('./routes/inventory');

const app = express();
const PORT = 3001;

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
