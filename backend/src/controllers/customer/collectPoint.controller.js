const pool = require('../../utils/database.js');

const collectPointController = async (req, res) => {
    const { customerId } = req.params; // CitizenId
    const { pointsToAdd } = req.body;

    if (!pointsToAdd || !customerId) {
        return res.status(400).json({ message: 'ต้องระบุ customerId และ pointsToAdd' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        console.log("DB connected for collectPoint");

        const rows = await conn.query('SELECT * FROM Customer WHERE CitizenID = ?', [customerId]);

        if (rows.length === 0) {
          return res.status(404).json({ message: 'ไม่พบลูกค้า' });
        }
        
        const customer = rows[0];
        
        const newPoint = customer.Point + pointsToAdd;
        
        // อัปเดตแต้ม
        await conn.query('UPDATE Customer SET Point = ? WHERE CitizenID = ?', [newPoint, customerId]);

        //just in case in the future we want to tell customer that you can redeem the point
        /*const rewardMessage = newPoint >= 10
            ? 'คุณมีสิทธิ์แลกรับเครื่องดื่มฟรี!'
            : null;*/

        res.status(200).json({
            citizenId: customerId,
            newPointBalance: newPoint
        });

    } catch (err) {
        console.error('Error collecting point:', err);
        res.status(500).json({ message: `เกิดข้อผิดพลาด ${err.message}` });
    } finally {
        if (conn) await conn.release();
    }
};

module.exports = collectPointController;
