const express = require('express');
const router = express.Router();

const listIngredientCategories = require('../controllers/ingredient/listIngredientCategories.controller');
const getIngredientsByCategory = require('../controllers/ingredient/getIngredientsByCategory.controller');

router.get('/', listIngredientCategories);
router.get('/:ingredientCategoryId/ingredients', getIngredientsByCategory);

module.exports = router;
