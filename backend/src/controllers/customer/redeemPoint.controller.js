const pool = require('../../utils/database.js');

const redeemPointController = async (req, res) => {
  const customerId = req.params.customerId;

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query('SELECT * FROM Customer WHERE CitizenID = ?', [customerId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบลูกค้า' });
    }

    const customer = rows[0];

    if (customer.Point < 10) {
      return res.status(400).json({ message: 'คะแนนไม่เพียงพอสำหรับแลกรับเครื่องดื่มฟรี' });
    }

    const newPoint = customer.Point - 10;

    await conn.query(
      'UPDATE Customer SET Point = ? WHERE CitizenID = ?',
      [newPoint, customerId]
    );

    res.status(200).json({
      citizenId: customerId,
      newPointBalance: newPoint,
      message: 'Free drink reward applied.'
    });

  } catch (err) {
    res.status(500).json({ message: `เกิดข้อผิดพลาด ${err.message}` });
  } finally {
    if (conn) await conn.release();
  }
};

module.exports = redeemPointController;
