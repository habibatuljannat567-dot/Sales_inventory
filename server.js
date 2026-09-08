const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: 'bzoye4hctdlfvksvj1vj-mysql.services.clever-cloud.com',
  user: 'umn1xyvjsgdtypzv',
  password: 'k4uM8uCsD9t6D6g9pqOc',
  database: 'bzoye4hctdlfvksvj1vj',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('Database Connection Error:', err);
  } else {
    console.log('Database Connected Successfully!');
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all products
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY id DESC', (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

// Add new product
app.post('/api/products', (req, res) => {
  const { name, price, stock } = req.body;
  const sql = 'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)';
  db.query(sql, [name, price, stock], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: 'Product added successfully', id: result.insertId });
  });
});

// Get all sales
app.get('/api/sales', (req, res) => {
  const sql = `
    SELECT sales.id, products.name AS product_name, sales.quantity, sales.total_price, sales.sale_date 
    FROM sales 
    JOIN products ON sales.product_id = products.id 
    ORDER BY sales.id DESC
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

// Sell product
app.post('/api/sales', (req, res) => {
  const { product_id, quantity } = req.body;

  db.query('SELECT price, stock FROM products WHERE id = ?', [product_id], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'Product not found' });

    const product = results[0];
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const total_price = product.price * quantity;
    const newStock = product.stock - quantity;

    db.query('INSERT INTO sales (product_id, quantity, total_price) VALUES (?, ?, ?)', [product_id, quantity, total_price], (err) => {
      if (err) return res.status(500).json(err);

      db.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, product_id], (err) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: 'Sale completed successfully' });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
