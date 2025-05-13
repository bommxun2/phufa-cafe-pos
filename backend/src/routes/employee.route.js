const express = require('express');
const router = express.Router();
const getEmployeeOrders = require('../controllers/order/getEmployeesOrder.controller');
const createEmployee = require('../controllers/employee/createEmployee.controller');
const updateEmployee = require('../controllers/employee/updateEmployee.controller');
const deleteEmployee = require('../controllers/employee/deleteEmployee.controller');
const getEmployeeById = require('../controllers/employee/getEmployeeById.controller');
const listAllEmployees = require('../controllers/employee/listAllEmployees.controller');

// Get all orders for a specific employee
router.get('/', listAllEmployees);
router.post('/', createEmployee);
router.get('/:empId', getEmployeeById);
router.put('/:empId', updateEmployee);
router.delete('/:empId', deleteEmployee);
router.get('/:empId/orders', getEmployeeOrders);

module.exports = router;
