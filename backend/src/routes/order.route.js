const express = require('express');
const router = express.Router();
const getEmployeeOrders = require('../controllers/order/getEmployeeOrders.controller');

// Get all orders for a specific employee
router.get('/employees/:empId/orders', getEmployeeOrders);

module.exports = router; 