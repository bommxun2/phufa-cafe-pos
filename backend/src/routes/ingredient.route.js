const express = require('express');
const router = express.Router();

const {
  editIngredient,
} = require('../controllers/ingredient/editIngredient.controller');
const {
  createNewIngredient,
} = require('../controllers/ingredient/createNewIngredient.controller');
const {
  deleteIngredient,
} = require('../controllers/ingredient/deleteIngredient.controller');
const getIngredientById = require('../controllers/ingredient/getIngredientById.controller');
const listAllIngredients = require('../controllers/ingredient/listAllIngredients.controller');

router.get('/', listAllIngredients);
router.post('/', createNewIngredient);
router.get('/:ingredientId', getIngredientById);
router.put('/:ingredientId', editIngredient);
router.delete('/:ingredientId', deleteIngredient);

module.exports = router;
