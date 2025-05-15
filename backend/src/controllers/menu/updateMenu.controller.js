const pool = require('../../utils/database');

const updateMenu = async (req, res) => {
  const menu = req.body;
  const {menuId} = req.params;

  // Validate the request body

  console.log('menu', menu);
  if (!menu.menuName || !menu.menuPrice || !menu.menuStatus || !menu.menuCategory || !menu.menuUrl) {
    return res.status(400).json({
      error: 'Bad Request - Invalid input data.',
    });
  }

  var conn;
  try {
    const updateMenu = `
    UPDATE Menu
    SET 
      MenuName = ?, 
      MenuPrice = ?, 
      MenuURL = ?, 
      MenuStatus = ?, 
      MenuCategory = ?, 
      MenuDescription = ?
    WHERE MenuID = ?;
    `;

    const updateDefaultRecipe = `
    UPDATE DefaultRecipe
    SET
      Quantity = ?, 
      IsBaseIngredient = ?, 
      IsReplaceable = ?
    WHERE MenuID = ? AND IngredientID = ?;
    `;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(updateMenu, [
      menu.menuName,
      menu.menuPrice,
      menu.menuUrl,
      menu.menuStatus,
      menu.menuCategory,
      menu.menuDescription,
      menuId,
    ]);

    if (menu.defaultRecipe) {
      for (const recipe of menu.defaultRecipe) {
        await conn.query(updateDefaultRecipe, [
          recipe.quantity,
          recipe.isReplaceable,
          recipe.isBaseIngredient,
          menuId,
          recipe.ingredientId,
        ]);
      }
    }

    await conn.commit();
    return res.status(200).json({
      menuId: menuId,
      menuName: menu.menuName,
      menuPrice: menu.menuPrice,
      menuStatus: menu.menuStatus,
      menuCategory: menu.menuCategory,
      menuDescription: menu.menuDescription,
      menuUrl: menu.menuUrl,
      defaultRecipe: menu.defaultRecipe,
    });
  } catch (err) {
    await conn.rollback();

    console.log(err);
    return res.status(500).json({error: 'Internal Server Error.'});
  } finally {
    await conn.release();
  }
};

module.exports = updateMenu;
