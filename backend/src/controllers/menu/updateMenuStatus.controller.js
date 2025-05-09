const pool = require('../../utils/database.js');

const updateMenuStatus = async (req, res) => {
    const  menuId  = req.params;
    const  newStatus  = req.body;

    if (!req.body || typeof newStatus === 'undefined') {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    if (!menuId) {
        return res.status(400).json({ message: 'Menu ID is required' });
    }

    const sql = `UPDATE Menu SET MenuStatus = ? WHERE MenuID = ?`;

    let conn;
    try {
        conn = await pool.getConnection();
        const {result} = await conn.query(sql, [newStatus, menuId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Menu not found." });
        }
        res.status(200).json({ message: "Menu status updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = updateMenuStatus;