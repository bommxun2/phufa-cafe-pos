const express = require("express");
const router = express.router();

const menuValidator = require("../middlewares/menuValidator.middleware");
const createMenu = require("../controllers/menu/createMenu.controller");
const updateMenu = require("../controllers/menu/updateMenu.controller");
const updateMenuStatus = require('../controllers/menu/updateMenuItemStatus.controller')
const getMenuByCategory = require('../controllers/menu/showMenuItemsByCategory.controller')

router.get('/', getMenuByCategory);
router.post("/", menuValidator, createMenu);
router.put("/:menuId", menuValidator, updateMenu);
router.patch('/:menuId', updateMenuStatus);

module.exports = router;