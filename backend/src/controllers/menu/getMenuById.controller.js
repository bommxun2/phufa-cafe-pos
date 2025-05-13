// backend/controllers/menu/getMenuItemById.controller.js
const db = require('../../utils/database');

/**
 * @desc    Get Menu Item by ID
 * @route   GET /api/menu/:menuId
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  const {menuId} = req.params;

  try {
    const menu = await db.query(
      'SELECT MenuID, MenuName, MenuPrice, MenuStatus, MenuCategory, MenuDescription, MenuURL FROM Menu WHERE MenuID = ?',
      [menuId],
    );

    if (!menu || menu.length === 0) {
      return res
        .status(404)
        .json({message: `Menu item with ID '${menuId}' not found.`});
    }

    res.status(200).json(menu[0]);
  } catch (error) {
    console.error(`Error retrieving menu item ${menuId}:`, error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving the menu item.',
    });
  }
};
