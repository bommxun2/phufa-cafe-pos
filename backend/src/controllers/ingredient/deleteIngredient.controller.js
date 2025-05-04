const pool = require("../../utils/database");
async function deleteIngredient(req, res) {
    const ingredientId = req.params.ingredientId;

    let conn;
    try {
        conn = await pool.getConnection();

        // ตรวจสอบว่า IngredientID ที่ต้องการลบมีอยู่ในฐานข้อมูลหรือไม่
        const existing = await conn.query(
            'SELECT ingredientId FROM Ingredient WHERE ingredientId = ? LIMIT 1', [ingredientId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }

        // ลบวัตถุดิบ
        const deleteQuery = 'DELETE FROM Ingredient WHERE ingredientId = ?';
        const deleteResult = await conn.query(deleteQuery, [ingredientId]);

        console.log(`Ingredient deleted, affected rows:`, deleteResult.affectedRows);
        if (deleteResult.affectedRows > 0) {
            res.status(204).json(); //ลบได้
        } else {
            res.status(400).json({ message: "Unable to delete ingredient" });
        }
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { deleteIngredient };