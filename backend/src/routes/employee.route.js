const express = require('express');
const router = express.Router();
const getEmployeeOrders = require('../controllers/order/getEmployeesOrder.controller');
const createEmployee = require('../controllers/employee/createEmployee.controller');

// Get all orders for a specific employee
router.get('/:empId/orders', getEmployeeOrders);
router.post('/', createEmployee);


module.exports = router;