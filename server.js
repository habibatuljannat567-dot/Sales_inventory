const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'bzoye4hctdlfvksvj1vj-mysql.services.clever-cloud.com',
    user: 'umn1xyvjsgdtypzv',
    password: 'k4uM8uCsD9t6D6g9pqOc',
    database: 'bzoye4hctdlfvksvj1vj',
    port: 3306
});;

db.connect((err) => {
    if (err) console.log('Database Connection Error:', err);
    else console.log('Database Connected Successfully!');
});

// ১. ইনভেন্টরি প্রোডাক্ট লিস্ট
app.get('/api/products', (req, res) => {
    db.query("SELECT * FROM products", (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// ২. বিক্রির হিস্ট্রি
app.get('/api/sales', (req, res) => {
    const sql = `
        SELECT sales.id, products.name AS product_name, sales.quantity, sales.total_price, sales.sale_date 
        FROM sales 
        JOIN products ON sales.product_id = products.id 
        ORDER BY sales.sale_date DESC
    `;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// ৩. কাস্টমার ও পেমেন্ট ট্রান্সজেকশন লিস্ট (ছবি অনুযায়ী)
app.get('/api/customers', (req, res) => {
    db.query("SELECT * FROM customers ORDER BY id DESC", (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// ৪. ড্যাশবোর্ড সামারি কার্ডস (Total Payments, Customers, Products, Orders)
app.get('/api/dashboard-summary', (req, res) => {
    const query = `
        SELECT 
            (SELECT COALESCE(SUM(total_price), 0) FROM sales) AS total_payments,
            (SELECT COUNT(*) FROM customers) AS total_customers,
            (SELECT COUNT(*) FROM products) AS total_products,
            (SELECT COUNT(*) FROM sales) AS total_orders
    `;
    db.query(query, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data[0]);
    });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
