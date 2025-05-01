const pool = require('../../utils/database');
const argon2 = require('argon2');

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

    // 2. ตรวจสอบข้อมูลเบื้องต้น
    if (!citizenId || !firstname || !lastname || !phoneNum || !empId || !empRole || !empSalary || !password) {
        return res.status(400).json({ message: 'Bad Request - Missing required fields.' });
    }

    // ---Validation---
    if (!/^\d{13}$/.test(citizenId)) { // Validation CitizenID
        return res.status(400).json({ message: 'Bad Request - Invalid Citizen ID format (must be 13 digits).' });
    }
    if (typeof empId !== 'string' || empId.length === 0 || empId.length > 10) { // Validation EmpID
        return res.status(400).json({ message: 'Bad Request - Invalid Employee ID format (max 10 chars).' });
    }
    if (!/^\d{10}$/.test(phoneNum)) { //validation PhoneNum
        return res.status(400).json({ message: 'Bad Request - Invalid Phone Number format (must be 10 digits).' });
    }

    let connection;
    try {
        // 3. Hash Password
        const passwordHash = await argon2.hash(password);

        // Transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 4. ตรวจสอบว่า CitizenID หรือ EmpID ซ้ำหรือไม่
        // 4.1 Check CitizenID in Person table
        let personCitizenRows;
        try {
            const queryResultCitizen = await connection.query('SELECT CitizenID FROM Person WHERE CitizenID = ? LIMIT 1', [citizenId]);

            if (!Array.isArray(queryResultCitizen)) {
                throw new Error('Unexpected non-array database query result for Person CitizenID check.');
            }

            if (queryResultCitizen.length === 0) {
                personCitizenRows = [];
            } else if (Array.isArray(queryResultCitizen[0]) && queryResultCitizen.length === 2 && Array.isArray(queryResultCitizen[1])) {
                personCitizenRows = queryResultCitizen[0];
            } else if (queryResultCitizen.length > 0 && typeof queryResultCitizen[0] === 'object' && queryResultCitizen[0] !== null) {
                personCitizenRows = queryResultCitizen;
            } else {
                throw new Error('Unexpected array structure from database query for Person CitizenID check.');
            }

            if (personCitizenRows.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Bad Request - Citizen ID already exists.' });
            }

        } catch (queryError) {
            console.error(`Error during Person CitizenID query for ID ${citizenId}:`, queryError);
             if (connection) {
                 try { await connection.rollback(); } catch (rbErr) { console.error('Rollback failed in query catch:', rbErr); }
                 try { connection.release(); } catch (rlErr) { console.error('Release failed in query catch:', rlErr); }
             }
            throw queryError; // Re-throw the error to be caught by the main try-catch
        }

        // 4.2 Check PhoneNum in Person table (UNIQUE constraint)
        let personPhoneRows;
        try {
            const queryResultPhone = await connection.query('SELECT PhoneNum FROM Person WHERE PhoneNum = ? LIMIT 1', [phoneNum]);

            if (!Array.isArray(queryResultPhone)) {
                throw new Error('Unexpected non-array database query result for Person PhoneNum check.');
            }

            if (queryResultPhone.length === 0) {
                 personPhoneRows = [];
            } else if (Array.isArray(queryResultPhone[0]) && queryResultPhone.length === 2 && Array.isArray(queryResultPhone[1])) {
                 personPhoneRows = queryResultPhone[0];
            } else if (queryResultPhone.length > 0 && typeof queryResultPhone[0] === 'object' && queryResultPhone[0] !== null) {
                 personPhoneRows = queryResultPhone;
            } else {
                 throw new Error('Unexpected array structure from database query for Person PhoneNum check.');
            }

            if (personPhoneRows.length > 0) {
                 await connection.rollback();
                 connection.release();
                 return res.status(400).json({ message: 'Bad Request - Phone number already registered.' });
            }

        } catch (queryError) {
            console.error(`Error during Person PhoneNum query for ${phoneNum}:`, queryError);
             if (connection) {
                 try { await connection.rollback(); } catch (rbErr) { console.error('Rollback failed in query catch:', rbErr); }
                 try { connection.release(); } catch (rlErr) { console.error('Release failed in query catch:', rlErr); }
             }
            throw queryError; // Re-throw
        }

        // 4.3 Check EmpID in Employee table
        let employeeIdRows;
        try {
            const queryResultEmpId = await connection.query('SELECT EmpID FROM Employee WHERE EmpID = ? LIMIT 1', [empId]);

            if (!Array.isArray(queryResultEmpId)) {
                 throw new Error('Unexpected non-array database query result for Employee EmpID check.');
            }

            if (queryResultEmpId.length === 0) {
                employeeIdRows = [];
            } else if (Array.isArray(queryResultEmpId[0]) && queryResultEmpId.length === 2 && Array.isArray(queryResultEmpId[1])) {
                employeeIdRows = queryResultEmpId[0];
            } else if (queryResultEmpId.length > 0 && typeof queryResultEmpId[0] === 'object' && queryResultEmpId[0] !== null) {
                employeeIdRows = queryResultEmpId;
            } else {
                throw new Error('Unexpected array structure from database query for Employee EmpID check.');
            }

            if (employeeIdRows.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Bad Request - Employee ID already exists.' });
            }

        } catch (queryError) {
            console.error(`Error during Employee EmpID query for ID ${empId}:`, queryError);
             if (connection) {
                 try { await connection.rollback(); } catch (rbErr) { console.error('Rollback failed in query catch:', rbErr); }
                 try { connection.release(); } catch (rlErr) { console.error('Release failed in query catch:', rlErr); }
             }
            throw queryError; // Re-throw
        }


        // 4.4 Check CitizenID in Employee table (UNIQUE constraint)
        let employeeCitizenRows;
        try {
             const queryResultEmpCitizen = await connection.query('SELECT CitizenID FROM Employee WHERE CitizenID = ? LIMIT 1', [citizenId]);

             if (!Array.isArray(queryResultEmpCitizen)) {
                 throw new Error('Unexpected non-array database query result for Employee CitizenID check.');
             }

             if (queryResultEmpCitizen.length === 0) {
                 employeeCitizenRows = [];
             } else if (Array.isArray(queryResultEmpCitizen[0]) && queryResultEmpCitizen.length === 2 && Array.isArray(queryResultEmpCitizen[1])) {
                 employeeCitizenRows = queryResultEmpCitizen[0];
             } else if (queryResultEmpCitizen.length > 0 && typeof queryResultEmpCitizen[0] === 'object' && queryResultEmpCitizen[0] !== null) {
                 employeeCitizenRows = queryResultEmpCitizen;
             } else {
                 throw new Error('Unexpected array structure from database query for Employee CitizenID check.');
             }

             if (employeeCitizenRows.length > 0) {
                 await connection.rollback();
                 connection.release();
                 return res.status(400).json({ message: 'Bad Request - Citizen ID already registered as an employee.' });
             }

        } catch (queryError) {
            console.error(`Error during Employee CitizenID query for ID ${citizenId}:`, queryError);
             if (connection) {
                 try { await connection.rollback(); } catch (rbErr) { console.error('Rollback failed in query catch:', rbErr); }
                 try { connection.release(); } catch (rlErr) { console.error('Release failed in query catch:', rlErr); }
             }
            throw queryError; // Re-throw
        }


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

        // 7. SELECT ข้อมูลพนักงานที่เพิ่งสร้างกลับมา
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

        // ตรวจสอบว่าเจอข้อมูลที่เพิ่งสร้างหรือไม่
        if (!employeeRows || employeeRows.length === 0) {
            await connection.rollback();
            connection.release();
            throw new Error('Failed to retrieve newly created employee.');
        }


        // --- Commit Transaction ---
        await connection.commit();

        const createdEmployeeDataFromDb = employeeRows;

        // 8. ส่ง Response กลับ (201 Created)
        res.status(201).json({ message: "Employee created successfully", data: createdEmployeeDataFromDb });

    } catch (error) {
        // --- Rollback Transaction (ถ้าเกิด Error) ---
        if (connection) {
            await connection.rollback();
        }

        console.error("Error creating employee:", error);

        // ถ้าเกิดจาก Error ที่เรา throw เองใน step 7
        if (error.message === 'Failed to retrieve newly created employee.') {
            return res.status(500).json({ message: 'Internal Server Error - Could not verify employee creation.' });
        }

        res.status(500).json({ message: 'Internal Server Error.' });

    } finally {
        // คืน Connection กลับสู่ Pool เสมอ
        if (connection) {
            connection.release();
        }
    }
};

module.exports = createEmployee;