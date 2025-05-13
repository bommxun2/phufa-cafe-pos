// src/controllers/ingredient/listIngredientsByCategory.controller.js
const db = require('../../utils/database');

/**
 * @desc    List Ingredients by Category ID
 * @route   GET /api/ingredient-categories/:ingredientCategoryId/ingredients
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  const {ingredientCategoryId} = req.params;

  try {
    // 1. Check if the ingredient category exists
    const category = await db.query(
      'SELECT IngredientCategoryID FROM IngredientCategory WHERE IngredientCategoryID = ?',
      [ingredientCategoryId],
    );
    if (category.length === 0) {
      return res.status(404).json({
        message: `Ingredient category with ID '${ingredientCategoryId}' not found.`,
      });
    }

    // 2. Fetch all ingredients belonging to this category
    const ingredients = await db.query(
      'SELECT IngredientID as ingredientId, Name as name, Quantity as quantity, Unit as unit, AdjustmentPrice as adjustmentPrice, CostPerUnit as costPerUnit, IngredientCategoryID as category FROM Ingredient WHERE IngredientCategoryID = ?',
      [ingredientCategoryId],
    );

    // If no ingredients are found for an existing category, it's valid to return an empty array.
    res.status(200).json(ingredients);
  } catch (error) {
    console.error(
      `Error retrieving ingredients for category ID ${ingredientCategoryId}:`,
      error,
    );
    res.status(500).json({
      message:
        'An unexpected error occurred while retrieving ingredients for the category.',
    });
  }
};
