const pool = require('../../utils/database');

/**
 * @description Controller สำหรับอัปเดตข้อมูลพนักงาน (PUT /employees/{empId})
 * @param {import('express').Request} req Request object
 * @param {import('express').Response} res Response object
 * @param {import('express').NextFunction} next Next function
 */
const updateEmployee = async (req, res, next) => {
    // 1. ดึงข้อมูลจาก Request Params และ Body
    const { empId } = req.params;
    const updateData = req.body;

    // 2. ตรวจสอบข้อมูลเบื้องต้น
    if (!empId) {
        return res.status(400).json({ message: 'Bad Request - Missing employee ID in path.' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Bad Request - Request body cannot be empty.' });
    }
    if (updateData.phoneNum && !/^\d{10}$/.test(updateData.phoneNum)) {
        return res.status(400).json({ message: 'Bad Request - Invalid Phone Number format (must be 9-10 digits).' });
    }


    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. ตรวจสอบว่า Employee ID นี้มีอยู่จริงหรือไม่ และดึง CitizenID มาด้วย
        let currentCitizenId;
        try {
            const [queryResultCheck] = await connection.query(
                'SELECT CitizenID FROM Employee WHERE EmpID = ? LIMIT 1',
                [empId]
            );
            let checkRows = [];
            if (typeof queryResultCheck === 'object' && queryResultCheck !== null && !Array.isArray(queryResultCheck)) {
                // กรณีที่ 1: ผลลัพธ์เป็น Object เดี่ยวๆ (เจอข้อมูล)
                if (Object.prototype.hasOwnProperty.call(queryResultCheck, 'CitizenID')) {
                    checkRows = [queryResultCheck]; 
                } else {
                    throw new Error('Employee check returned an object without the expected CitizenID field.');
                }
            } else if (Array.isArray(queryResultCheck)) {
                // กรณีที่ 2: ผลลัพธ์เป็น Array
                if (queryResultCheck.length === 0) {
                    checkRows = []; // []
                } else if (Array.isArray(queryResultCheck[0]) && queryResultCheck.length === 2 && Array.isArray(queryResultCheck[1])) {
                    checkRows = queryResultCheck[0]; // [rows, fields]
                } else if (queryResultCheck.length > 0 && typeof queryResultCheck[0] === 'object' && queryResultCheck[0] !== null) {
                    checkRows = queryResultCheck; // [{...}]
                } else {
                    console.error('--- Unexpected array structure:', JSON.stringify(queryResultCheck));
                }
            } else if (queryResultCheck === null || queryResultCheck === undefined) {
                // กรณีที่ 3: ผลลัพธ์เป็น null หรือ undefined
                checkRows = [];
            } else {
                console.error('--- Completely unexpected query result type:', typeof queryResultCheck);
                throw new Error('Unexpected database query result type for Employee check.');
            }

            if (checkRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'Employee not found.' });
            }
            currentCitizenId = checkRows[0].CitizenID;

        } catch (checkError) {
            console.error(`Error checking employee existence for EmpID ${empId}:`, checkError);
            await connection.rollback();
            connection.release();
            throw checkError;
        }


        // 4. สร้าง SQL UPDATE Statements แบบไดนามิก
        const personSetClauses = [];
        const personValues = [];
        const employeeSetClauses = [];
        const employeeValues = [];

        // Mapping API fields (camelCase) to DB fields (PascalCase)
        const apiToDbPerson = {
            firstname: 'FirstName',
            lastname: 'LastName',
            gender: 'Gender',
            phoneNum: 'PhoneNum',
            address: 'Address',
            profileUrl: 'ProfileURL',
        };
        const apiToDbEmployee = {
            empRole: 'EmpRole',
            empSalary: 'EmpSalary',
        };

        for (const key in updateData) {
            if (Object.prototype.hasOwnProperty.call(updateData, key)) {
                const value = updateData[key];
                if (apiToDbPerson[key]) {
                    if (key === 'phoneNum' && value !== null && value !== undefined) {
                        try {
                            const queryResult = await connection.query(
                                'SELECT 1 FROM Person WHERE PhoneNum = ? AND CitizenID != ? LIMIT 1', 
                                [value, currentCitizenId]
                            );

                            let duplicateFound = false;

                            if (typeof queryResult === 'object' && queryResult !== null) {
                                if (!Array.isArray(queryResult)) {
                                    duplicateFound = true;
                                } else {
                                    if (queryResult.length > 0) {
                                        if (Array.isArray(queryResult[0])) {
                                            if (queryResult.length === 2 && Array.isArray(queryResult[1])) { 
                                                duplicateFound = queryResult[0].length > 0;
                                            } else {
                                                duplicateFound = true;
                                            }
                                        } else if (typeof queryResult[0] === 'object') {
                                            duplicateFound = true;
                                        }
                                    }
                                }
                            }

                            if (duplicateFound) {
                                await connection.rollback();
                                connection.release();
                                return res.status(400).json({ message: 'Bad Request - Phone number already registered by another person.' });
                            }

                        } catch (phoneCheckError) {
                            console.error(`Error during PhoneNum uniqueness check for ${value}:`, phoneCheckError);
                            throw phoneCheckError;
                        }
                    } 
                    personSetClauses.push(`${apiToDbPerson[key]} = ?`);
                    personValues.push(value);
                } else if (apiToDbEmployee[key]) {
                    employeeSetClauses.push(`${apiToDbEmployee[key]} = ?`);
                    employeeValues.push(value);
                }
            }
        }

        // ตรวจสอบว่ามี field ให้อัปเดตหรือไม่
        if (personSetClauses.length === 0 && employeeSetClauses.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Bad Request - No valid fields provided for update.' });
        }

        // 5. Execute UPDATE Statements
        // 5.1 Update Person table
        if (personSetClauses.length > 0) {
            const personUpdateQuery = `UPDATE Person SET ${personSetClauses.join(', ')} WHERE CitizenID = ?`;
            personValues.push(currentCitizenId);
            await connection.query(personUpdateQuery, personValues);
        }

        // 5.2 Update Employee table
        if (employeeSetClauses.length > 0) {
            const employeeUpdateQuery = `UPDATE Employee SET ${employeeSetClauses.join(', ')} WHERE EmpID = ?`;
            employeeValues.push(empId);
            await connection.query(employeeUpdateQuery, employeeValues);
        }

        // 6. Commit Transaction
        await connection.commit();

        // 7. ดึงข้อมูล Employee ที่อัปเดตแล้วกลับมา (Join Person และ Employee)
        const selectQuery = `
            SELECT
                p.CitizenID       AS citizenId,
                p.FirstName       AS firstname,
                p.LastName        AS lastname,
                p.Gender          AS gender,
                p.PhoneNum        AS phoneNum,
                p.Address         AS address,
                p.ProfileURL      AS profileUrl,
                e.EmpID           AS empId,
                e.EmpRole         AS empRole,
                e.EmpSalary       AS empSalary
            FROM Person p
            JOIN Employee e ON p.CitizenID = e.CitizenID
            WHERE e.EmpID = ?;
        `;
        const [updatedEmployeeRows] = await connection.query(selectQuery, [empId]);

        let finalRows = [];
        if (typeof updatedEmployeeRows === 'object' && updatedEmployeeRows !== null && !Array.isArray(updatedEmployeeRows)) {
            if (Object.prototype.hasOwnProperty.call(updatedEmployeeRows, 'citizenId')) { 
                finalRows = [updatedEmployeeRows];
            }
        } else if (Array.isArray(updatedEmployeeRows)) {
            if (updatedEmployeeRows.length === 0) finalRows = [];
            else if (Array.isArray(updatedEmployeeRows[0]) && updatedEmployeeRows.length === 2 && Array.isArray(updatedEmployeeRows[1])) finalRows = updatedEmployeeRows[0];
            else if (updatedEmployeeRows.length > 0 && typeof updatedEmployeeRows[0] === 'object') finalRows = updatedEmployeeRows;
            else { console.error('Unexpected array structure from SELECT query.'); }
        } else if (updatedEmployeeRows === null || updatedEmployeeRows === undefined) {
            finalRows = [];
        } else {
            console.error('Unexpected non-array/object result from SELECT query.');
            throw new Error('Unexpected database query result type after update.');
        }

        if (finalRows.length === 0) {
            connection.release();
            throw new Error('Failed to retrieve updated employee data after update.');
        }

        const updatedEmployeeData = finalRows[0];

        if (updatedEmployeeData && typeof updatedEmployeeData.empSalary === 'string') {
            updatedEmployeeData.empSalary = parseFloat(updatedEmployeeData.empSalary);
        }

        // 8. ส่ง Response กลับ
        res.status(200).json(updatedEmployeeData);

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        console.error(`Error updating employee with EmpID ${empId}:`, error);

        // จัดการ Error ที่เรา throw เอง
        if (error.message === 'Failed to retrieve updated employee data after update.') {
            return res.status(500).json({ message: 'Internal Server Error - Could not verify employee update.' });
        }

        res.status(500).json({ message: 'Internal Server Error.' });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = updateEmployee;