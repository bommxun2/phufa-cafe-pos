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

* **Menu Management:** Add, edit, and manage menu items and categories.
* **Order Management:**  Take orders digitally, track order status, and manage order history.
* **Automated Calculation:**  System automatically calculates order totals and generates receipts.
* **Real-time Sales Reporting:**  Track sales data in real-time and generate daily sales reports.
* **Employee Management:** (Optional - if implemented) Manage employee accounts and roles.
* **Customer Loyalty Program:** (Optional - if implemented) Implement a point-based loyalty program for customers.
* **Store Information Management:** Manage store opening and closing times.

## Technology Stack

* **Frontend:** Next.js (Version 15)
* **Backend:** Next.js (Version 15)
* **Database:** MariaDB (Version 11.8)

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

* This project was developed as a student project.
* Thanks to Phufa Café for providing the real-world context for this project.