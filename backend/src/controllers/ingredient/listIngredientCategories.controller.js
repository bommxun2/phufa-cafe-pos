// backend/controllers/ingredient/listIngredientCategories.controller.js
const db = require('../../utils/database');

/**
 * @desc    List Ingredient Categories
 * @route   GET /api/ingredient-categories
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  try {
    const categories = await db.query(
      'SELECT IngredientCategoryID as ingredientCategoryId, Name as name, AllowMultipleSelection as allowMultipleSelection, IsCustomizable as isCustomizable FROM IngredientCategory',
    );

    // Convert 0/1 from DB to boolean true/false for JSON response
    const formattedCategories = categories.map(cat => ({
      ...cat,
      allowMultipleSelection: !!cat.allowMultipleSelection,
      isCustomizable: !!cat.isCustomizable,
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error('Error listing ingredient categories:', error);
    res.status(500).json({
      message:
        'An unexpected error occurred while retrieving ingredient categories.',
    });
  }
};
