const express = require('express');
const createCustomerController = require('../controllers/customer/createCustomer.controller');
const updateCustomerController = require('../controllers/customer/updateCustomer.controller');
const collectPointController = require('../controllers/customer/collectPoint.controller');
const redeemPointController = require('../controllers/customer/redeemPoint.controller');
const router = express.Router();

// Route: POST /api/customers
// Controller: createCustomerController
router.post('/', createCustomerController);

// Route: PUT /api/customers/:customerId
// Controller: updateCustomerController
// (:customerId คือ CitizenID)
router.put('/:customerId', updateCustomerController);

// Route: POST /api/customers/:customerId/points //เก็บแต้ม
// Controller: collectPointController
router.post('/:customerId/points', collectPointController);
// Route: POST /api/customers/:customerId/redeem //แลกแต้ม
// Controller: redeemPointController
router.post('/:customerId/redeem', redeemPointController);

module.exports = router;