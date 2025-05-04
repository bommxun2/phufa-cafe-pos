const express = require("express");
const router = express.Router();

const { editIngredient } = require("../controllers/ingredient/editIngredient.controller");
const { createNewIngredient } = require("../controllers/ingredient/createNewIngredient.controller");
const { deleteIngredient } = require("../controllers/ingredient/deleteIngredient.controller");


router.post("/", createNewIngredient);
router.put("/:ingredientId", editIngredient);
router.delete("/:ingredientId", deleteIngredient);

module.exports = router;