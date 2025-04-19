const express = require('express');
const router = express.Router();
const getEmployeeOrders = require('../controllers/order/getEmployeesOrder.controller');

// Get all orders for a specific employee
router.get('/:empId/orders', getEmployeeOrders);

module.exports = router;