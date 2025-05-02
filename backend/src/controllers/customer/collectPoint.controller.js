const pool = require('../../utils/database.js');

const collectPointController = async (req, res) => {
    const { citizenId, phoneNum, point } = req.body;

    if (!point || (!citizenId && !phoneNum)) {
        return res.status(400).json({ message: 'ต้องระบุ CitizenID หรือ PhoneNum และ Point' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        console.log("DB connected for collectPoint");

        // ค้นหาลูกค้าด้วย citizenId หรือ phoneNum
        const [customer] = await conn.query(
            `SELECT c.Point, c.CitizenID 
             FROM Customer c 
             JOIN Person p ON c.CitizenID = p.CitizenID
             WHERE p.CitizenID = ? OR p.PhoneNum = ? LIMIT 1`,
            [citizenId || '', phoneNum || '']
        );

        if (!customer || customer.length === 0) {
            await conn.release();
            return res.status(404).json({ message: 'ไม่พบลูกค้า' });
        }

        const currentPoint = customer[0].Point;
        const newPoint = currentPoint + parseInt(point);

        // อัปเดตแต้ม
        await conn.query(
            `UPDATE Customer SET Point = ? WHERE CitizenID = ?`,
            [newPoint, customer[0].CitizenID]
        );

        const rewardMessage = newPoint >= 10
            ? 'คุณมีสิทธิ์แลกรับเครื่องดื่มฟรี!'
            : null;

        res.status(200).json({
            message: 'สะสมแต้มสำเร็จ',
            currentPoint: newPoint,
            reward: rewardMessage,
        });

    } catch (err) {
        console.error('Error collecting point:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
    } finally {
        if (conn) await conn.release();
    }
};

module.exports = collectPointController;
