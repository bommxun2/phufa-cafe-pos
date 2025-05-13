const {body} = require('express-validator');

const createMenuValidator = [
  body('menuName').isString().notEmpty(),
  body('menuPrice').isFloat({gt: 0}),
  body('menuStatus').isIn(['พร้อมขาย', 'ไม่พร้อมขาย']),
  body('menuCategory').isString().notEmpty(),
  body('menuDescription').isString(),
  body('menuUrl').isURL(),
  body('defaultRecipe').isArray({min: 1}),
  body('defaultRecipe.*.ingredientId').isString().notEmpty(),
  body('defaultRecipe.*.quantity').isFloat({gt: 0}),
  body('defaultRecipe.*.isBaseIngredient').isBoolean(),
  body('defaultRecipe.*.isReplaceable').isBoolean(),
];

const updateMenuValidator = [
  body('menuName').optional().isString().notEmpty(),
  body('menuPrice').optional().isFloat({gt: 0}),
  body('menuStatus').optional().isIn(['พร้อมขาย', 'ไม่พร้อมขาย']),
  body('menuCategory').optional().isString().notEmpty(),
  body('menuDescription').optional().isString(),
  body('menuUrl').optional().isURL(),
  body('defaultRecipe').optional().isArray({min: 1}),
  body('defaultRecipe.*.ingredientId').optional().isString().notEmpty(),
  body('defaultRecipe.*.quantity').optional().isFloat({gt: 0}),
  body('defaultRecipe.*.isBaseIngredient').optional().isBoolean(),
  body('defaultRecipe.*.isReplaceable').optional().isBoolean(),
];

module.exports = {createMenuValidator, updateMenuValidator};
