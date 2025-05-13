const pool = require('../../utils/database');
const {generateMenuId} = require('../../utils/idGenerator');

const createMenu = async (req, res) => {
  const menu = req.body;

  var conn;
  try {
    const insertMenu = `
    INSERT INTO Menu (MenuId, MenuName, MenuPrice, MenuStatus, MenuDescription, MenuURL, MenuCategory)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const insertDefaultRecipe = `
    INSERT INTO DefaultRecipe (MenuID, IngredientID, Quantity, IsBaseIngredient, IsReplaceable)
    VALUES (?, ?, ?, ?, ?);
    `;

    // Check if ingredient exists
    const checkIngredient = `
    SELECT IngredientID FROM Ingredient WHERE IngredientID = ?;
    `;

    conn = await pool.getConnection();

    let notExistIngredients = [];
    for (const recipe of menu.defaultRecipe) {
      const ingredientId = recipe.ingredientId;
      const rows = await pool.query(checkIngredient, [ingredientId]);
      if (rows.length === 0) {
        notExistIngredients.push(ingredientId);
      }
    }
    if (notExistIngredients.length > 0) {
      return res.status(400).json({
        message: `Ingredient(s) with ID(s) ${notExistIngredients.join(', ')} do not exist.`,
      });
    }

    await conn.beginTransaction();

    // Increase PK
    let menuId = generateMenuId();

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
    return res.status(500).json({message: 'Internal Server Error.'});
  } finally {
    await conn.release();
  }
};

module.exports = createMenu;
