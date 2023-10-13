// Required modules
const inquirer = require('inquirer');
const mysql = require('mysql2');
require('dotenv').config()
// Port settings
const PORT = process.env.PORT || 3001;

// Set up the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

// Connect to the database and initiate the main menu prompt
db.connect(err => {
    if (err) throw err;
    mainPrompt();
});

// Function to view all departments
function viewAllDepartments() {
    const query = "SELECT department.id, department.name as department_Name FROM department";
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

// Function to view all roles
function viewAllRoles() {
    const query = `
    SELECT role.id AS 'Role ID',
           role.title AS 'Role Title',
           role.salary AS Salary,
           department.name AS 'Department Name'
    FROM role
    JOIN department ON role.department_id = department.id
    ORDER BY role.id;
`;
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

// Function to view all employees
function viewAllEmployees() {
    const query = `
    SELECT emp.id AS 'Employee ID',
           emp.first_name AS 'First Name',
           emp.last_name AS 'Last Name',
           role.title AS 'Role Title',
           role.salary AS Salary,
           department.name AS 'Department Name',
           CONCAT(mgr.first_name, ' ', mgr.last_name) AS 'Manager Name'
    FROM employee emp
    LEFT JOIN role ON emp.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee mgr ON emp.manager_id = mgr.id
    ORDER BY emp.id;
`;
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt();
    });
}

// Function to add a new department
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

// Function to add a new role
async function addNewRole() {
    try {
        // Fetch all departments
        const [departments] = await db.promise().query("SELECT * FROM department");
        // Check if there are any departments
        if (!departments.length) {
            console.error("No departments found.");
            return start();
        }
        // Prompt user to provide details for the new role
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
        // Find the corresponding department based on the user's selection
        const department = departments.find(dept => dept.name === answer.departmentName);
        // If no matching department is found, return to the main menu
        if (!department) {
            console.error("Matching department not found.");
            return mainPrompt();
        }
        // Insert the new role into the database
        await db.promise().query(
            "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)",
            [answer.roleTitle, parseFloat(answer.roleSalary), department.id]
        );

        console.log(`Added new role: ${answer.roleTitle}`);
        mainPrompt();

    } catch (err) {
        // Handle errors and return to the main menu
        console.error(err);
        mainPrompt();
    }
}
// Function to add a new employee
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

async function updateEmployeeRole() {
    try {
        // Fetch all roles and employees
        const [roles] = await db.promise().query("SELECT * FROM role");
        const [employees] = await db.promise().query("SELECT * FROM employee");

        // If no employees or roles exist, return to main menu
        if (!employees.length || !roles.length) {
            console.error("Employees or roles are missing.");
            return start();
        }

        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "employeeName",
                message: "Select the employee whose role you want to update:",
                choices: employees.map(employee => `${employee.first_name} ${employee.last_name}`)
            },
            {
                type: "list",
                name: "newRole",
                message: "Select the new role for the employee:",
                choices: roles.map(role => role.title)
            }
        ]);

        // Extract IDs for the employee and role based on the selected names
        const employee = employees.find(emp => `${emp.first_name} ${emp.last_name}` === answers.employeeName);
        const role = roles.find(r => r.title === answers.newRole);

        // Update the employee's role in the database
        await db.promise().query(
            "UPDATE employee SET role_id = ? WHERE id = ?",
            [role.id, employee.id]
        );

        console.log(`Updated role for ${answers.employeeName} to ${answers.newRole}`);
        mainPrompt();

    } catch (err) {
        console.error(err);
        mainPrompt();
    }
}

// Main prompt that serves as the application's menu
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
        // Handle user's action based on their choice
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

