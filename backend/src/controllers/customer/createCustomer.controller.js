const pool = require('../../utils/database.js');

/**
 * @description สร้างลูกค้าใหม่
 * @route POST /api/customers
 * @access Private (ปรับตามต้องการ)
 */
const createCustomerController = async (req, res, next) => { 

    if (req.body === undefined) {
        return res.status(400).json({ message: 'Request body is undefined' });
    }

    const {
        citizenId,
        firstname,
        lastname,
        gender,
        phoneNum,
        address,
        profileUrl
    } = req.body;

    // --- Basic Validation (ควรใช้ Library) ---
    if (!citizenId || !firstname || !lastname || !phoneNum) {
        return res.status(400).json({ message: 'Missing required fields: citizenId, firstname, lastname, phoneNum' });
    }
    if (citizenId.length !== 13 || !/^\d+$/.test(citizenId)) {
         return res.status(400).json({ message: 'Invalid Citizen ID format (must be 13 digits)' });
    }
    // ... (validation อื่นๆ)

    let conn; // ประกาศ conn ไว้ข้างนอก try เพื่อให้ finally เห็น
    try {
        // 1. ขอ Connection จาก Pool
        conn = await pool.getConnection();
        console.log("DB Connection obtained for creating customer");

        // 2. ตรวจสอบว่า CitizenID หรือ PhoneNum ซ้ำหรือไม่ (ในตาราง Person)
        const existingPerson = await conn.query(
            'SELECT CitizenID FROM Person WHERE CitizenID = ? OR PhoneNum = ? LIMIT 1',
            [citizenId, phoneNum]
        );

        if (existingPerson && existingPerson.length > 0 && existingPerson[0]?.CitizenID) { 
            await conn.release();
            console.log("DB Connection released - Duplicate found");
            return res.status(400).json({ message: 'Citizen ID or Phone Number already exists.' });
        }

        // 3. เริ่ม Transaction
        await conn.beginTransaction();
        console.log("Transaction started");

        // 4. เพิ่มข้อมูลในตาราง Person
        const personInsertResult = await conn.query(
            'INSERT INTO Person (CitizenID, FirstName, LastName, Gender, PhoneNum, Address, ProfileURL) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [citizenId, firstname, lastname, gender || null, phoneNum, address || null, profileUrl || null]
        );
        console.log("Person inserted, affected rows:", personInsertResult.affectedRows);

        // 5. เพิ่มข้อมูลในตาราง Customer (Point เริ่มต้นที่ 0)
        const customerInsertResult = await conn.query(
            'INSERT INTO Customer (CitizenID, Point) VALUES (?, 0)',
            [citizenId]
        );
        console.log("Customer inserted, affected rows:", customerInsertResult.affectedRows);


        // 6. Commit Transaction
        await conn.commit();
        console.log("Transaction committed");

        // 7. ดึงข้อมูลลูกค้าที่สร้างเสร็จสมบูรณ์ (Join Person & Customer) เพื่อส่งกลับ
        const newCustomerData = await conn.query(
            `SELECT
                p.CitizenID as citizenId,
                p.FirstName as firstname,
                p.LastName as lastname,
                p.Gender as gender,
                p.PhoneNum as phoneNum,
                p.Address as address,
                p.ProfileURL as profileUrl,
                c.Point as point
             FROM Person p
             JOIN Customer c ON p.CitizenID = c.CitizenID
             WHERE p.CitizenID = ?`,
            [citizenId]
        );

        if (!newCustomerData || newCustomerData.length === 0) {
             console.error(`Failed to retrieve new customer data for ID: ${citizenId} after commit`);
             return res.status(500).json({ message: 'Internal error retrieving created customer data.' });
        }

        console.log(`Customer created successfully: ${citizenId}`);
        res.status(201).json(newCustomerData[0]);

    } catch (error) {
        console.error('Error creating customer:', error);
        if (conn) {
            try {
                console.log("Rolling back transaction due to error");
                await conn.rollback();
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }
        res.status(500).json({ message: 'Error creating customer', error: error.message });

    } finally {
        if (conn) {
            try {
                await conn.release();
                console.log("DB Connection released");
            } catch (releaseErr) {
                console.error('Error releasing connection:', releaseErr);
            }
        }
    }
};

module.exports = createCustomerController; // Export แค่ฟังก์ชันนี้