const pool = require('../../utils/database');
const {
  generateIngredientId,
  generateIngredientCategoryId,
} = require('../../utils/idGenerator');

async function createNewIngredient(req, res) {
  const {name, quantity, unit, adjustmentPrice, costPerUnit, category} =
    req.body;

  let categoryId;

  // ตรวจสอบว่าได้รับข้อมูลครบถ้วนหรือไม่
  if (
    !name ||
    !quantity ||
    !unit ||
    !Number.isInteger(adjustmentPrice) ||
    !costPerUnit ||
    !category
  ) {
    return res.status(400).json({message: 'Incomplete information'});
  }
  let conn;
  try {
    conn = await pool.getConnection();
    // ตรวจสอบว่า IngredientID หรือ Name ซ้ำหรือไม่
    const checkQuery = `
                SELECT * FROM Ingredient 
                WHERE name = ?
            `;
    const rows = await conn.query(checkQuery, [name]);
    if (rows.length > 0) {
      return res.status(400).json({
        message: `Ingredient with name ${name} already exists.`,
      });
    }

    // ตรวจสอบว่า IngredientCategoryID มีอยู่ในฐานข้อมูลหรือไม่
    const checkCategoryQuery = `
                SELECT * FROM IngredientCategory 
                WHERE Name = ?
            `;
    const categoryRows = await conn.query(checkCategoryQuery, [category]);
    if (categoryRows.length === 0) {
      // create new category
      const insertCategoryQuery = `
                INSERT INTO IngredientCategory (IngredientCategoryID, Name)
                VALUES (?, ?)
            `;
      categoryId = generateIngredientCategoryId();
      await conn.query(insertCategoryQuery, [categoryId, category]);
    } else if (categoryRows.length === 1) {
      // ใช้ IngredientCategoryID ที่มีอยู่แล้ว
      categoryId = categoryRows[0].IngredientCategoryID;
    }

    // สร้าง IngredientID ใหม่
    const ingredientId = generateIngredientId();

    const insertQuery = `
            INSERT INTO Ingredient (ingredientId, name, quantity, unit, adjustmentPrice, costPerUnit, IngredientCategoryID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    await conn.query(insertQuery, [
      ingredientId,
      name,
      quantity,
      unit,
      adjustmentPrice,
      costPerUnit,
      categoryId,
    ]);

    res.status(201).json({
      ingredientId,
      name,
      quantity,
      unit,
      adjustmentPrice,
      costPerUnit,
      category: categoryId,
    });
  } catch (error) {
    res
      .status(500)
      .json({message: 'Internal server error', error: error.message});
  } finally {
    if (conn) conn.release();
  }
}
module.exports = {createNewIngredient};
