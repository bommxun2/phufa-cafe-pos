const express = require('express');
const router = express.Router();

const updateMenuStatus = require('../controllers/menu/updateMenuItemStatus.controller')
const getMenuByCategory = require('../controllers/menu/showMenuItemsByCategory.controller')

router.patch('/:menuId', updateMenuStatus);
router.get('/', getMenuByCategory);

module.exports = router;