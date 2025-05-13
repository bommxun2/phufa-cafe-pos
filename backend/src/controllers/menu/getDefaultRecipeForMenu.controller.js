const db = require('../../utils/database');

/**
 * @desc    Get Default Recipe for a Menu Item
 * @route   GET /api/menu/:menuId/recipe
 * @access  Private (Authenticated users)
 */
const getDefaultRecipeForMenu = async (req, res) => {
  const {menuId} = req.params;

  // 1. ตรวจสอบก่อนว่า MenuID นี้มีอยู่จริงในตาราง Menu หรือไม่ (เป็นทางเลือกที่ดี)
  const menuExists = await db.query(
    'SELECT MenuID FROM Menu WHERE MenuID = ?',
    [menuId],
  );

  if (menuExists.length === 0) {
    return res.status(404).json({
      message: `Menu item with ID '${menuId}' not found.`,
    });
  }

  // 2. ดึงข้อมูลสูตร DefaultRecipe จากฐานข้อมูล
  const recipeItems = await db.query(
    `SELECT 
        dr.IngredientID AS ingredientId, 
        dr.Quantity AS quantity,
        dr.IsBaseIngredient AS isBaseIngredient,
        dr.IsReplaceable AS isReplaceable
     FROM DefaultRecipe dr
     WHERE dr.MenuID = ?`,
    [menuId],
  );

  // 3. ตรวจสอบว่าพบสูตรสำหรับ MenuID นี้หรือไม่
  if (recipeItems.length === 0) {
    // ถ้า MenuID มีอยู่แต่ไม่มีสูตร (อาจจะยังไม่ได้กำหนด) ก็ควรตอบ 404 ตาม API spec
    return res.status(404).json({
      message: `Recipe for menu ID '${menuId}' not found.`,
    });
  }

  // 4. จัดรูปแบบข้อมูลให้ตรงกับ schema 'DefaultRecipe' ใน OpenAPI
  // MySQL BOOLEAN จะคืนค่าเป็น 0 หรือ 1, ต้องแปลงเป็น true/false
  const formattedRecipe = recipeItems.map(item => ({
    ingredientId: item.ingredientId,
    quantity: parseFloat(item.quantity), // Quantity เป็น DECIMAL ใน DB
    isBaseIngredient: Boolean(item.isBaseIngredient),
    isReplaceable: Boolean(item.isReplaceable),
  }));

  // 5. ส่ง response กลับไป
  res.status(200).json(formattedRecipe);
};

module.exports = getDefaultRecipeForMenu;
