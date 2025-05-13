// backend/controllers/ingredient/getIngredientById.controller.js
const db = require('../../utils/database');

/**
 * @desc    Get Ingredient by ID
 * @route   GET /api/ingredients/:ingredientId
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  const {ingredientId} = req.params;

  try {
    const ingredient = await db.query(
      'SELECT IngredientID as ingredientId, Ingredient.Name as name, Quantity as quantity, Unit as unit, AdjustmentPrice as adjustmentPrice, CostPerUnit as costPerUnit, IngredientCategory.IngredientCategoryID as category FROM Ingredient LEFT JOIN IngredientCategory ON Ingredient.IngredientCategoryID = IngredientCategory.IngredientCategoryID WHERE IngredientID = ?',
      [ingredientId],
    );

    if (!ingredient || ingredient.length === 0) {
      return res
        .status(404)
        .json({message: `Ingredient with ID '${ingredientId}' not found.`});
    }

    res.status(200).json(ingredient[0]);
  } catch (error) {
    console.error(`Error retrieving ingredient ${ingredientId}:`, error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving the ingredient.',
    });
  }
};
