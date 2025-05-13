const express = require('express');
const createCustomerController = require('../controllers/customer/createCustomer.controller');
const updateCustomerController = require('../controllers/customer/updateCustomer.controller');
const collectPointController = require('../controllers/customer/collectPoint.controller');
const redeemPointController = require('../controllers/customer/redeemPoint.controller');
const getCustomerById = require('../controllers/customer/getCustomerById.controller');
const listAllCustomers = require('../controllers/customer/listAllCustomers.controller');
const router = express.Router();

router.get('/', listAllCustomers);
router.post('/', createCustomerController);
router.get('/:customerId', getCustomerById);
router.put('/:customerId', updateCustomerController);
router.post('/:customerId/points', collectPointController);
router.post('/:customerId/redeem', redeemPointController);

module.exports = router;
