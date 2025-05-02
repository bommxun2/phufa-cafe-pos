const express = require('express');
const createCustomerController = require('../controllers/customer/createCustomer.controller');
const updateCustomerController = require('../controllers/customer/updateCustomer.controller');

const router = express.Router();

// Route: POST /api/customers
// Controller: createCustomerController
router.post('/', createCustomerController);

// Route: PUT /api/customers/:customerId
// Controller: updateCustomerController
// (:customerId คือ CitizenID)
router.put('/:customerId', updateCustomerController);

const collectPointController = require('../controllers/customer/collectPoint.controller');

// Route: POST /api/customers/collect-point
router.post('/collect-point', collectPointController);

module.exports = router;