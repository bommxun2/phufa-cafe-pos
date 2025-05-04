const pool = require("../../utils/database");

async function createNewIngredient(req, res) {
    const { ingredientId, name, quantity, unit, adjustmentPrice, costPerUnit, category } = req.body;

    // ตรวจสอบว่าได้รับข้อมูลครบถ้วนหรือไม่
    if (!ingredientId || !name || !quantity || !unit || !adjustmentPrice || !costPerUnit || !category) {
        return res.status(400).json({ message: "Incomplete information" });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        // ตรวจสอบว่า IngredientID หรือ Name ซ้ำหรือไม่
        const checkQuery = `
                SELECT * FROM Ingredient 
                WHERE ingredientId = ? 
            `;
        const rows = await conn.query(checkQuery, ingredientId);
        if (rows.length > 0) {
            return res.status(400).json({ message: "ingredientId already exists" });
        }

        const insertQuery = `
            INSERT INTO Ingredient (ingredientId, name, quantity, unit, adjustmentPrice, costPerUnit, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await conn.query(insertQuery, [ingredientId, name, quantity, unit, adjustmentPrice, costPerUnit, category]);

        res.status(201).json({
            ingredientId,
            name,
            quantity,
            unit,
            adjustmentPrice,
            costPerUnit,
            category
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    } finally {
        if (conn)
            conn.release();
    }
}
module.exports = { createNewIngredient };