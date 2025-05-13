const pool = require('../../utils/database.js');

const updateMenuStatus = async (req, res) => {
  const {menuId} = req.params;
  const {menuStatus} = req.body;

  // Validate request body
  if (menuStatus !== 'พร้อมขาย' && menuStatus !== 'ไม่พร้อมขาย') {
    return res.status(400).json({message: 'Invalid menu status'});
  }

  if (!req.body || typeof menuStatus === 'undefined') {
    return res.status(400).json({message: 'Invalid request body'});
  }

  if (!menuId) {
    return res.status(400).json({message: 'Menu ID is required'});
  }

  const sql = `UPDATE Menu SET MenuStatus = ? WHERE MenuID = ?`;

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, [menuStatus, menuId]);

    console.log(result.affectedRows);
    if (result.affectedRows === 0) {
      return res.status(404).json({message: 'Menu not found.'});
    }
    res.status(200).json({message: 'Menu status updated successfully.'});
  } catch (err) {
    res.status(500).json({message: err.message});
  } finally {
    if (conn) conn.release();
  }
};

module.exports = updateMenuStatus;
