const express = require('express');
const router = express.Router();
const { getDailyIncome } = require('../controllers/report.controller');

// Get daily income summary
router.get('/daily-income', getDailyIncome);

module.exports = router; 