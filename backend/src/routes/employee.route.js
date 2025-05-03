const express = require('express');
const router = express.Router();
const getEmployeeOrders = require('../controllers/order/getEmployeesOrder.controller');
const createEmployee = require('../controllers/employee/createEmployee.controller');
const updateEmployee = require('../controllers/employee/updateEmployee.controller');
const deleteEmployee = require('../controllers/employee/deleteEmployee.controller');


// Get all orders for a specific employee
router.get('/:empId/orders', getEmployeeOrders);
router.post('/', createEmployee);


// TODO: Added access authentication middleware for admin/owners
router.put('/:empId', updateEmployee);
// TODO: Added access authentication middleware for admin/owners
router.delete('/:empId', deleteEmployee);


module.exports = router;