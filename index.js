const inquirer = require('inquirer');
const mysql = require('mysql2');
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

function viewAllDepartments() {
    const query = "SELECT * FROM department";
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

function viewAllRoles() {
    const query = "SELECT * FROM role";
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

function viewAllEmployees() {
    const query = "SELECT * FROM employee";
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

function addNewDepartment() {
    inquirer.prompt({
        type: "input",
        name: "departmentName",
        message: "Enter the name of the new department:"
    }).then(answer => {
        db.query(`INSERT INTO department (name) VALUES ('${answer.departmentName}')`, (err, res) => {
                if (err) throw err;
                console.log(`Added ${answer.departmentName} to departments.`);
                mainPrompt();
            }
        );
    });
}



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
            case "View all roles":
                viewAllRoles();
                break;
            case "View all employees":
                viewAllEmployees();
                break;
            case "Add a department":
                addNewDepartment();
                break;
            case "Add a department":
                addDepartment();
                break;
            case "Add a department":
                addDepartment();
                break;
            case "Add a department":
                addDepartment();
                break;
            case "Exit":
                db.end();
                break;
        }
    });
}

