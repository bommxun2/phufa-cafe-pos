const pool = require('../../utils/database');

/**
 * @description Controller สำหรับสร้างพนักงานใหม่ (POST /employees)
 * @param {import('express').Request} req Request object
 * @param {import('express').Response} res Response object
 * @param {import('express').NextFunction} next Next function
 */
const createEmployee = async (req, res, next) => {
    // 1. ดึงข้อมูลจาก Request Body (camelCase)
    const {
        citizenId,
        firstname,
        lastname,
        gender,
        phoneNum,
        address,
        profileUrl,
        empId,
        empRole,
        empSalary,
        password
    } = req.body;

    // 2. ตรวจสอบข้อมูลเบื้องต้น (เหมือนเดิม)
    if (!citizenId || !firstname || !lastname || !phoneNum || !empId || !empRole || !empSalary || !password) {
        return res.status(400).json({ message: 'Bad Request - Missing required fields.' });
    }
    if (!/^\d{13}$/.test(citizenId)) {
        return res.status(400).json({ message: 'Bad Request - Invalid Citizen ID format.' });
    }

    let connection;
    try {
        // ---------- ส่วนนี้คือการทำงานกับฐานข้อมูล ----------

        // 3. Hash Password (เหมือนเดิม)
        const saltRounds = 10;

        // TODO: Use argon2 for hashing password
        const passwordHash = password;

        // --- เริ่ม Transaction ---
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 4. ตรวจสอบว่า CitizenID หรือ EmpID ซ้ำหรือไม่ (เหมือนเดิม)
        // ... (โค้ดตรวจสอบ ID ซ้ำ)
        // if (/* ID ซ้ำ */) {
        //     await connection.rollback();
        //     connection.release();
        //     return res.status(400).json({ message: '...' });
        // }

        // 5. บันทึกข้อมูลลงตาราง Person (ใช้ชื่อคอลัมน์ตาม DB)
        const personQuery = `
           INSERT INTO Person (CitizenID, FirstName, LastName, Gender, PhoneNum, Address, ProfileURL)
           VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        const personValues = [citizenId, firstname, lastname, gender, phoneNum, address, profileUrl];
        await connection.query(personQuery, personValues);

        // 6. บันทึกข้อมูลลงตาราง Employee (ใช้ชื่อคอลัมน์ตาม DB)
        const employeeQuery = `
           INSERT INTO Employee (EmpID, CitizenID, EmpPasswordHash, EmpRole, EmpSalary)
           VALUES (?, ?, ?, ?, ?);
        `;
        const employeeValues = [empId, citizenId, passwordHash, empRole, empSalary];
        await connection.query(employeeQuery, employeeValues);

        // 7. SELECT ข้อมูลพนักงานที่เพิ่งสร้างกลับมา (ปรับปรุงส่วนนี้)
        const selectQuery = `
            SELECT
                p.CitizenID       AS citizenId,      -- Alias เป็น camelCase
                p.FirstName       AS firstname,
                p.LastName        AS lastname,
                p.Gender          AS gender,
                p.PhoneNum        AS phoneNum,
                p.Address         AS address,
                p.ProfileURL      AS profileUrl,
                e.EmpID           AS empId,          -- Alias เป็น camelCase
                e.EmpRole         AS empRole,
                e.EmpSalary       AS empSalary
            FROM Person p
            JOIN Employee e ON p.CitizenID = e.CitizenID
            WHERE e.EmpID = ?;
        `;
        const [employeeRows] = await connection.query(selectQuery, [empId]);

        // ตรวจสอบว่าเจอข้อมูลที่เพิ่งสร้างหรือไม่ (ควรจะเจอเสมอถ้า Insert สำเร็จ)
        if (!employeeRows || employeeRows.length === 0) {
            await connection.rollback(); // ถ้าไม่เจอ แสดงว่ามีบางอย่างผิดพลาด
            connection.release();
            throw new Error('Failed to retrieve newly created employee.'); // โยน Error ให้ catch จัดการ
        }

        
        // --- Commit Transaction ---
        await connection.commit();
        
        const createdEmployeeDataFromDb = employeeRows;

        // 8. ส่ง Response กลับ (201 Created) โดยใช้ข้อมูลจาก SELECT
        // ข้อมูลจาก createdEmployeeDataFromDb ควรจะเป็น camelCase อยู่แล้วจาก Alias ใน SQL
        // อาจจะต้องแปลง EmpSalary เป็น number อีกครั้งถ้า DB driver คืนค่าเป็น string
        // createdEmployeeDataFromDb.empSalary = parseFloat(createdEmployeeDataFromDb.empSalary);

        // res.status(201).json(createdEmployeeDataFromDb);
        res.status(201).json({ message: "Employee created successfully", data: createdEmployeeDataFromDb }); // ตัวอย่าง ควรใส่ข้อมูลจริง

        // ---------- จบส่วนการทำงานกับฐานข้อมูล ----------

    } catch (error) {
        // --- Rollback Transaction (ถ้าเกิด Error) ---
        if (connection) {
            await connection.rollback();
        }

        console.error("Error creating employee:", error);

        // ... (Error handling อื่นๆ เช่น ER_DUP_ENTRY)

        // ถ้าเกิดจาก Error ที่เรา throw เองใน step 7
        if (error.message === 'Failed to retrieve newly created employee.') {
            return res.status(500).json({ message: 'Internal Server Error - Could not verify employee creation.' });
        }

        res.status(500).json({ message: 'Internal Server Error.' });
        // next(error);
    } finally {
        // คืน Connection กลับสู่ Pool เสมอ
        if (connection) {
            connection.release();
        }
    }
};

module.exports = createEmployee;