const { body } = require("express-validator");

const menuValidator = [
  body("menuName").isString().notEmpty(),
  body("menuPrice").isFloat({ gt: 0 }),
  body("menuStatus").isIn(["พร้อมขาย", "ไม่พร้อมขาย"]),
  body("menuCategory").isString().notEmpty(),
  body("menuDescription").isString(),
  body("menuUrl").isURL(),
  body("defaultRecipe").isArray({ min: 1 }),
  body("defaultRecipe.*.ingredientId").isString().notEmpty(),
  body("defaultRecipe.*.quantity").isFloat({ gt: 0 }),
  body("defaultRecipe.*.isBaseIngredient").isBoolean(),
  body("defaultRecipe.*.isReplaceable").isBoolean(),
];

module.exports = menuValidator;
