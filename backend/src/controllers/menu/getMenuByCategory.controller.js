const pool = require('../../utils/database.js');

const getMenuByCategory = async (req, res) => {
    const menuCategory = req.query;

    if (!menuCategory) {
        return res.status(400).json({ message: 'Category is required' });
    }

    const sql = `
        SELECT * FROM Menu WHERE Category = ?; 
    `;

    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(sql, [menuCategory]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = getMenuByCategory;
