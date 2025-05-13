// backend/controllers/ingredient/listAllIngredients.controller.js
const db = require('../../utils/database');

/**
 * @desc    List All Ingredients
 * @route   GET /api/ingredients
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  try {
    const ingredients = await db.query(
      'SELECT IngredientID as ingredientId, Name as name, Quantity as quantity, Unit as unit, AdjustmentPrice as adjustmentPrice, CostPerUnit as costPerUnit, IngredientCategoryID as category FROM Ingredient',
    );
    res.status(200).json(ingredients);
  } catch (error) {
    console.error('Error listing all ingredients:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving ingredients.',
    });
  }
};
