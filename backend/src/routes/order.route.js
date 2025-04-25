const express = require('express');
const router = express.Router();

const CreateNewOrder = require('../controllers/order/createNewOrder.controller')

router.post('/', CreateNewOrder)

module.exports = router