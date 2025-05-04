const pool = require("../../utils/database");
const { validationResult } = require("express-validator");

const createMenu = async (req, res) => {
  const menu = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Bad Request - Invalid input data.",
    });
  }

  var conn;
  try {
    const getMenuPk = `SELECT IFNULL(MAX(MenuId), 0) AS menuId FROM Menu;`;

    const insertMenu = `
    INSERT INTO Menu (MenuId, MenuName, MenuPrice, MenuStatus, MenuDescription, MenuURL, MenuCategory)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const insertDefaultRecipe = `
    INSERT INTO DefaultRecipe (MenuID, IngredientID, Quantity, IsBaseIngredient, IsReplaceable)
    VALUES (?, ?, ?, ?, ?);
    `;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Increase PK
    let [results] = await conn.query(getMenuPk);
    let menuId;
    if (results.menuId == 0) {
      menuId = "M000000001";
    } else {
      const prefix = results.menuId.slice(0, 1);
      const number = parseInt(results.menuId.slice(1));

      const newNumber = number + 1;
      const padded = String(newNumber).padStart(9, "0");

      menuId = prefix + padded;
    }

    let result = await conn.query(insertMenu, [
      menuId,
      menu.menuName,
      menu.menuPrice,
      menu.menuStatus,
      menu.menuDescription,
      menu.menuUrl,
      menu.menuCategory,
    ]);

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
    return res.status(201).json({
      menuId: menuId,
      menuName: menu.menuName,
      menuPrice: menu.menuPrice,
      menuStatus: menu.menuStatus,
      menuCategory: menu.menuCategory,
      menuDescription: menu.menuDescription,
      menuUrl: menu.menuUrl,
    });
  } catch (err) {
    await conn.rollback();

    console.log(err);
    return res.status(500).json({ error: "Internal Server Error." });
  } finally {
    await conn.release();
  }
};

module.exports = createMenu;
