const express = require('express');
const router = express.Router();

const createNewOrder = require('../controllers/order/createNewOrder.controller');
const updateOrderStatus = require('../controllers/order/updateOrderStatus.controller');
const deleteOrderById = require('../controllers/order/deleteOrderById.controller');

router.post('/', createNewOrder)
router.patch('/:orderId', updateOrderStatus);
router.delete('/:orderId', deleteOrderById);

module.exports = router