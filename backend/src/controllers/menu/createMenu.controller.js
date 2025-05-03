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
    const getMenuPk = `SELECT ISNULL(MAX(MenuId), 0) FROM Menu);`;
    
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
    let id = await conn.query(getMenuPk);
    if (id == 0) {
      id = "M000000001";
    } else {
      const prefix = id.slice(0, 1);
      const number = parseInt(id.slice(1));

      const newNumber = number + 1;
      const padded = String(newNumber).padStart(9, "0");

      id = prefix + padded;
    }

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

module.exports = createMenu;
