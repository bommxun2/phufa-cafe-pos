const pool = require("../../utils/database");
const validationResult = require("express-validator");

const createMenu = async (req, res) => {
  const { menu } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Bad Request - Invalid input data.",
    });
  }

  var conn;
  try {
    const insertMenu = `
    INSERT INTO Menu (MenuName, MenuPrice, MenuStatus, MenuDescription, MenuURL, MenuCategory)
    VALUES (?, ?, ?, ?, ?, ?);
    `;

    const insertDefaultRecipe = `
    INSERT INTO DefaultRecipe (MenuID, IngredientID, Quantity, IsBaseIngredient, IsReplaceable)
    VALUES (?, ?, ?, ?, ?);
    `;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    let result = await conn.query(insertMenu, [
      menu.menuName,
      menu.menuPrice,
      menu.menuStatus,
      menu.menuDescription,
      menu.menuURL,
      menu.menuCategory,
    ]);

    const menuId = result.insertId;
    for (const recipe of menu.defaultRecipe) {
      await conn.query(insertDefaultRecipe, [
        menuId,
        recipe.ingredientId,
        recipe.quantity,
        recipe.isBaseIngredient,
        recipe.isReplaceable,
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

module.exports = createMenu