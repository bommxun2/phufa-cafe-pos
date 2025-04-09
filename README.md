# Phufa Cafe POS System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

Phufa Cafe POS System is a web-based Point of Sale (POS) application designed to streamline operations for coffee shops, specifically modeled after "Phufa Café". This system aims to replace manual, paper-based processes with a digital solution for order taking, payment processing, and sales reporting. By using digital devices like tablets or computers, the system reduces errors, speeds up service, and provides real-time sales insights for better business management.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Installation

1.  **Configure Environment Variables:**
    *   Copy the default environment file: `cp .env.default .env`
    *   Edit the `.env` file with your specific configurations (database credentials, etc.).

2.  **Run the Application:**
    *   Use Docker Compose to build and start the services: `docker compose up`
    *   The application should now be accessible, typically at [http://localhost/](http://localhost) (or as configured).

## Features

*   **Menu Management:** Add, edit, delete, and change the status of menu items and view recipes.
*   **Order Taking & Management:** Employees can digitally record customer orders and update order statuses (e.g., pending, paid).
*   **Automated Calculation & Receipt Generation:** The system automatically calculates order totals based on items and customizations. (Receipt generation is implied for POS).
*   **Sales Reporting:** Track sales data in real-time and generate daily sales summary reports for the owner.
*   **Employee Management:** Add and edit employee information (name, role, salary) and manage system access.
*   **Customer Management:** Manage customer information.
*   **Customer Loyalty Program:** Implement a point-based system for customers to accumulate points and redeem rewards (e.g., free drinks).
*   **Inventory Management:** Manage ingredients/stock levels, automatically updating quantities based on menu items sold according to their recipes.

## Technology Stack

* **Frontend:** Node.js (Version 22)
* **Backend:** Node.js (Version 22)
* **Database:** MariaDB (Version 11)

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

* This project was developed as a student project.
* Thanks to Phufa Café for providing the real-world context for this project.