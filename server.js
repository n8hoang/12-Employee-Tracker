const express = require('express');
const mysql = require('mysql');
const app = express();
require('dotenv').config()
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});