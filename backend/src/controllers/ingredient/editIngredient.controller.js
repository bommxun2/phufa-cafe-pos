const pool = require('../../utils/database');

async function editIngredient(req, res) {
  const ingredientId = req.params.ingredientId;
  const updateData = req.body;

  // ตรวจสอบว่ามีข้อมูลส่งมาหรือไม่
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({message: 'No data provided for update'});
  }

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('DB Connection obtained for updating Ingredient');

    // ตรวจสอบว่า IngredientID นี้มีอยู่จริงหรือไม่
    const existing = await conn.query(
      'SELECT * FROM Ingredient WHERE ingredientId = ? LIMIT 1',
      [ingredientId],
    );

    if (existing.length === 0) {
      return res.status(404).json();
    }

    const currentData = existing[0]; // ข้อมูลเก่าของ ingredient

    // ฟิลด์ที่อนุญาตให้แก้ไข
    const allowedFields = [
      'name',
      'quantity',
      'unit',
      'adjustmentPrice',
      'costPerUnit',
      'IngredientCategoryID',
    ];

    updateData.category = ingredientId; // เพิ่ม ingredientId ลงใน updateData

    const updateFields = [];
    const updateValues = [];

    for (const key in updateData) {
      if (allowedFields.includes(key)) {
        const value =
          typeof updateData[key] === 'string'
            ? updateData[key].trim()
            : updateData[key];
        if (value !== undefined && value !== null && value !== '') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    }

    // ไม่มีฟิลด์ที่สามารถอัปเดตได้
    if (updateFields.length === 0) {
      return res.status(400).json({message: 'No valid fields to update'});
    }

    // Construct SQL UPDATE and inject values
    const updateQuery = `UPDATE Ingredient SET ${updateFields.join(', ')} WHERE ingredientId = ?`;
    updateValues.push(ingredientId);

    const updateResult = await conn.query(updateQuery, updateValues);
    console.log(
      `Ingredient updated, affected rows:`,
      updateResult.affectedRows,
    );

    // ส่งข้อมูลที่อัปเดตกลับไป
    const updatedIngredient = {...currentData, ...updateData};

    res.status(200).json({
      ingredientId: updatedIngredient.ingredientId,
      name: updatedIngredient.name,
      quantity: updatedIngredient.quantity,
      unit: updatedIngredient.unit,
      adjustmentPrice: updatedIngredient.adjustmentPrice,
      costPerUnit: updatedIngredient.costPerUnit,
      category: updatedIngredient.category,
    });
  } catch (error) {
    console.error('Error occurred while updating:', error);
    res
      .status(500)
      .json({message: 'Internal server error', error: error.message});
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {editIngredient};
