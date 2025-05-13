const express = require('express');
const router = express.Router();
const getDailyIncome = require('../controllers/report/getDailyIncomes.controller');

// Get daily income summary
router.get('/daily-income', getDailyIncome);

module.exports = router;
