const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database Connection (XAMPP Localhost)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smart_inventory',
  port: 3306
});

db.connect((err) => {
  if (err) console.error('Database Error:', err);
  else console.log('XAMPP Database Connected Successfully!');
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- PRODUCTS API ---
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY id DESC', (err, data) => res.json(data || []));
});

app.post('/api/products', (req, res) => {
  const { name, price, stock } = req.body;
  db.query('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', [name, price, stock], () => res.json({ message: 'Added' }));
});

app.put('/api/products/:id', (req, res) => {
  const { name, price, stock } = req.body;
  db.query('UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?', [name, price, stock, req.params.id], () => res.json({ message: 'Updated' }));
});

app.delete('/api/products/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id = ?', [req.params.id], () => res.json({ message: 'Deleted' }));
});

// --- CUSTOMERS API ---
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers ORDER BY id DESC', (err, data) => res.json(data || []));
});

app.post('/api/customers', (req, res) => {
  const { customer_name, customer_phone, customer_address } = req.body;
  db.query('INSERT INTO customers (customer_name, customer_phone, customer_address) VALUES (?, ?, ?)', 
    [customer_name, customer_phone, customer_address], () => res.json({ message: 'Customer Saved' }));
});

// --- SALES & FILTERING API ---
app.get('/api/sales', (req, res) => {
  const { startDate, endDate, productId } = req.query;
  let sql = `
    SELECT sales.id, products.name AS product_name, sales.quantity, sales.total_price, sales.sale_date, sales.customer_name 
    FROM sales 
    LEFT JOIN products ON sales.product_id = products.id
  `;
  let conditions = [];
  let params = [];

  if (startDate && endDate) {
    conditions.push(`sales.sale_date BETWEEN ? AND ?`);
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  if (productId) {
    conditions.push(`sales.product_id = ?`);
    params.push(productId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  sql += ` ORDER BY sales.id DESC`;

  db.query(sql, params, (err, data) => res.json(data || []));
});

app.post('/api/sales', (req, res) => {
  const { product_id, quantity, customer_name } = req.body;

  db.query('SELECT price, stock FROM products WHERE id = ?', [product_id], (err, results) => {
    if (err || !results || results.length === 0) return res.status(400).json({ error: 'Product not found' });

    const product = results[0];
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const total_price = product.price * quantity;
    const newStock = product.stock - quantity;

    db.query('INSERT INTO sales (product_id, quantity, total_price, customer_name) VALUES (?, ?, ?, ?)', 
      [product_id, quantity, total_price, customer_name || 'Guest'], () => {
      db.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, product_id], () => res.json({ message: 'Sale completed' }));
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
