INSERT INTO department (name) VALUES 
("Sales"),
("Engineering"),
("Finance"),
("HR");

INSERT INTO role (title, salary, department_id) VALUES 
("Sales Executive", 60000, 1),
("Software Engineer", 90000, 2),
("Accountant", 75000, 3),
("HR Specialist", 65000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES 
("John", "Doe", 1, 2),
("Jane", "Smith", 2, 2),
("Alice", "Johnson", 3, 1),
("Bob", "Williams", 4, 3);