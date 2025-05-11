const express = require('express');
const router = express.Router();

const CreateNewOrder = require('../controllers/order/createNewOrder.controller');
const deleteOrderById = require('../controllers/order/deleteOrderById.controller');

router.post('/', CreateNewOrder)
router.delete('/:orderId', deleteOrderById)

module.exports = router