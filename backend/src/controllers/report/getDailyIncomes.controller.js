const db = require('../../utils/database');

module.exports = async (req, res) => {
    const { date } = req.query;

    // Validate date format (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            error: 'Invalid date format. Please use YYYY-MM-DD'
        });
    }

    try {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) AS orderCount,
                IFNULL(SUM(OrderPrice), 0) AS totalIncome
            FROM \`Order\`
            WHERE DATE(OrderDateTime) = ? AND OrderStatus = 1
        `, [date]);

        const { orderCount, totalIncome } = rows[0];

        res.json({
            date,
            totalIncome: Number(totalIncome),
            orderCount: Number(orderCount),
            note: 'Income calculation only includes paid orders'
        });

    } catch (err) {
        console.error('❌ Error fetching daily income:', err);
        res.status(500).json({ "message": "An unexpected error occurred while retrieving employee orders."});
    }
};