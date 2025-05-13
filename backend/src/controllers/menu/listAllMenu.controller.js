const db = require('../../utils/database');

/**
 * @desc    List All Menu Items
 * @route   GET /api/menu
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  try {
    let query =
      'SELECT MenuID, MenuName, MenuPrice, MenuStatus, MenuCategory, MenuDescription, MenuURL FROM Menu';

    const menus = await db.query(query);

    if (!menus || menus.length === 0) {
      return res.status(404).json({
        message: 'No menu items found.',
      });
    }

    res.status(200).json(
      menus.map(menu => ({
        menuId: menu.MenuID,
        menuName: menu.MenuName,
        menuPrice: menu.MenuPrice,
        menuStatus: menu.MenuStatus,
        menuCategory: menu.MenuCategory,
        menuDescription: menu.MenuDescription,
        menuURL: menu.MenuURL,
      })),
    );
  } catch (error) {
    console.error('Error listing all menu items:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving menu items.',
    });
  }
};
