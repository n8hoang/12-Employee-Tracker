const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
const PORT = process.env.PORT || 3001;


const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

db.connect(err => {
    if (err) throw err;
    mainPrompt();
});

const viewAllDepartments = async () => {
    const [rows] = await db.execute('SELECT * FROM department');
    return rows;
};

function mainPrompt() {
    inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role",
                "Add an employee",
                "Update an employee role",
                "Exit"
            ]
        }
    ]).then(answer => {
        switch (answer.action) {
            case "View all departments":
                viewAllDepartments();
                break;
            // ... handle other cases
            case "Exit":
                db.end();
                break;
        }
    });
}

