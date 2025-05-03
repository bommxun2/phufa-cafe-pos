const pool = require("../../utils/database");
const { validationResult } = require("express-validator");

const updateMenu = async (req, res) => {
  const { menu } = req.body;
  const menuId = req.params("menuId");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Bad Request - Invalid input data.",
    });
  }

  try {
    const updateMenu = `
    UPDATES Menu
    SET 
      MenuName = ?, 
      MenuPrice = ?, 
      MenuURL = ?, 
      MenuStatus = ?, 
      MenuCategory = ?, 
      MenuDescription = ?, 
    WHERE MenuID = ?;
    `;

    const updateDefaultRecipe = `
    UPDATES DefaultRecipe
    SET
      Quantity = ?, 
      IsBaseIngredient = ?, 
      IsReplaceable = ?
    WHERE MenuID = ? AND IngredientId = ?
    `;

    const conn = pool.getConnection();
    await conn.beginTransaction();

    await conn.query(updateMenu, [
      menu.menuName,
      menu.menuPrice,
      menu.menuURL,
      menu.menuStatus,
      menu.menuCategory,
      menu.menuDescription,
      menuId,
    ]);

    for (const recipe of menu.defaultRecipe) {
      await conn.query(updateDefaultRecipe, [
        recipe.quantity,
        recipe.isReplaceable,
        recipe.isBaseIngredient,
      ]);
    }

    await conn.commit();
    conn.release();

    return res.status(201).json({
      menuId: menuId,
      menuName: menu.menuName,
      menuPrice: menu.menuPrice,
      menuStatus: menu.menuStatus,
      menuCategory: menu.menuCategory,
      menuDescription: menu.menuDescription,
      menuUrl: menu.menuURL,
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    return res.status(500).json({ error: "Internal Server Error." });
  }
};

module.exports = updateMenu;
