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
        message: "What is the name of the new department?"
    }).then(answer => {
        db.query(`INSERT INTO department (name) VALUES ('${answer.departmentName}')`, (err, res) => {
                if (err) throw err;
                console.log(`Added ${answer.departmentName} to departments.`);
                mainPrompt();
            }
        );
    });
}
async function addNewRole() {
    try {
        const [departments] = await db.promise().query("SELECT * FROM department");

        if (!departments.length) {
            console.error("No departments found.");
            return start();
        }

        const answer = await inquirer.prompt([
            {
                type: "input",
                name: "roleTitle",
                message: "Enter the title of the new role:"
            },
            {
                type: "input",
                name: "roleSalary",
                message: "Enter the salary for this role:",
                validate: value => {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return "Please enter a valid number.";
                }
            },
            {
                type: "list",
                name: "departmentName",
                message: "Which department does this role belong to?",
                choices: departments.map(department => department.name)
            }
        ]);

        const department = departments.find(dept => dept.name === answer.departmentName);

        if (!department) {
            console.error("Matching department not found.");
            return mainPrompt();
        }

        await db.promise().query(
            "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)",
            [answer.roleTitle, parseFloat(answer.roleSalary), department.id]
        );

        console.log(`Added new role: ${answer.roleTitle}`);
        mainPrompt();

    } catch (err) {
        console.error(err);
        mainPrompt();
    }
}

async function addNewEmployee() {
    try {
        // Fetch all roles and employees
        const [roles] = await db.promise().query("SELECT * FROM role");
        const [employees] = await db.promise().query("SELECT * FROM employee");

        // If no roles exist, return to main menu
        if (!roles.length) {
            console.error("No roles found. Add roles first.");
            return start();
        }

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "firstName",
                message: "What is the employee's first name?"
            },
            {
                type: "input",
                name: "lastName",
                message: "What is the employee's last name?"
            },
            {
                type: "list",
                name: "roleName",
                message: "What is the employee's role?",
                choices: roles.map(role => role.title)
            },
            {
                type: "list",
                name: "managerName",
                message: "Select the employee's manager (if any):",
                choices: ["None", ...employees.map(employee => `${employee.first_name} ${employee.last_name}`)]
            }
        ]);

        // Find the ID of the selected role
        const role = roles.find(r => r.title === answers.roleName);
        let managerId = null;

        // If a manager was selected (and it wasn't "None"), find their ID
        if (answers.managerName !== "None") {
            const manager = employees.find(employee => `${employee.first_name} ${employee.last_name}` === answers.managerName);
            managerId = manager.id;
        }

        // Insert new employee into the database
        await db.promise().query(
            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
            [answers.firstName, answers.lastName, role.id, managerId]
        );

        console.log(`Added new employee: ${answers.firstName} ${answers.lastName}`);
        mainPrompt();

    } catch (err) {
        console.error(err);
        mainPrompt();
    }
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
            case "Add a role":
                addNewRole();
                break;
            case "Add an employee":
                addNewEmployee();
                break;
            case "Update an employee role":
                updateEmployeeRole();
                break;
            case "Exit":
                db.end();
                break;
        }
    });
}

