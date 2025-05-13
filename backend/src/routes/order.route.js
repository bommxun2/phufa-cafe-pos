const express = require('express');
const router = express.Router();

const createNewOrder = require('../controllers/order/createNewOrder.controller');
const updateOrderStatus = require('../controllers/order/updateOrderStatus.controller');
const deleteOrderById = require('../controllers/order/deleteOrderById.controller');
const getOrderById = require('../controllers/order/getOrderById.controller');
const listAllOrders = require('../controllers/order/listAllOrders.controller');

router.get('/', listAllOrders);
router.post('/', createNewOrder);
router.get('/:orderId', getOrderById);
router.patch('/:orderId', updateOrderStatus);
router.delete('/:orderId', deleteOrderById);

module.exports = router;
