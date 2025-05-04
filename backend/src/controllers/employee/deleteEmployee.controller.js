const pool = require('../../utils/database'); 

/**
 * @description Controller สำหรับลบข้อมูลพนักงาน
 * @param {import('express').Request} req Request object
 * @param {import('express').Response} res Response object
 * @param {import('express').NextFunction} next Next function
 */
const deleteEmployee = async (req, res, next) => {
    // 1. ดึงข้อมูลจาก Request Params
    const { empId } = req.params;

    // 2. ตรวจสอบข้อมูลเบื้องต้น
    if (!empId) {
        return res.status(400).json({ message: 'Bad Request - Missing employee ID in path.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 3. ตรวจสอบว่า Employee ID
        let employeeData;
        let citizenIdToDelete;
        try {
            const queryResultCheck = await connection.query(
                'SELECT EmpID, CitizenID FROM Employee WHERE EmpID = ? LIMIT 1',
                [empId]
            );

            let checkRows = [];
            if (typeof queryResultCheck === 'object' && queryResultCheck !== null && !Array.isArray(queryResultCheck)) {
                 if (Object.prototype.hasOwnProperty.call(queryResultCheck, 'CitizenID')) {
                    checkRows = [queryResultCheck];
                 }
            } else if (Array.isArray(queryResultCheck)) {
                 if (queryResultCheck.length === 0) checkRows = [];
                 else if (Array.isArray(queryResultCheck[0]) && queryResultCheck.length === 2 && Array.isArray(queryResultCheck[1])) checkRows = queryResultCheck[0];
                 else if (queryResultCheck.length > 0 && typeof queryResultCheck[0] === 'object') checkRows = queryResultCheck;
            } else if (queryResultCheck === null || queryResultCheck === undefined) {
                checkRows = [];
            } else {
                 throw new Error('Unexpected database query result type for Employee existence check.');
            }

            if (checkRows.length === 0) {
                connection.release(); 
                return res.status(404).json({ message: 'Employee not found.' });
            }
            employeeData = checkRows[0];
            citizenIdToDelete = employeeData.CitizenID;

        } catch (checkError) {
            console.error(`Error checking employee existence for EmpID ${empId}:`, checkError);
             if (connection) connection.release(); 
            throw checkError; 
        }

        // 4. ตรวจสอบ Dependency
        // ตรวจสอบว่ามี Order ไหนผูกกับ EmpID นี้หรือไม่
        try {
            const queryResultOrderCheck = await connection.query(
                'SELECT OrderID FROM `Order` WHERE EmpID = ? LIMIT 1', 
                [empId]
            );

            let orderCheckRows = [];
             if (typeof queryResultOrderCheck === 'object' && queryResultOrderCheck !== null && !Array.isArray(queryResultOrderCheck)) {
                 if (Object.prototype.hasOwnProperty.call(queryResultOrderCheck, 'OrderID')) {
                    orderCheckRows = [queryResultOrderCheck];
                 }
            } else if (Array.isArray(queryResultOrderCheck)) {
                 if (queryResultOrderCheck.length === 0) orderCheckRows = [];
                 else if (Array.isArray(queryResultOrderCheck[0]) && queryResultOrderCheck.length === 2 && Array.isArray(queryResultOrderCheck[1])) orderCheckRows = queryResultOrderCheck[0];
                 else if (queryResultOrderCheck.length > 0 && typeof queryResultOrderCheck[0] === 'object') orderCheckRows = queryResultOrderCheck;
            } else if (queryResultOrderCheck === null || queryResultOrderCheck === undefined) {
                orderCheckRows = [];
            } else {
                 throw new Error('Unexpected database query result type for Order dependency check.');
            }


            if (orderCheckRows.length > 0) {
                connection.release();
                return res.status(400).json({ message: 'Bad Request - Cannot delete employee because they have associated orders.' });
            }

        } catch (dependencyError) {
            console.error(`Error checking dependencies for EmpID ${empId}:`, dependencyError);
             if (connection) connection.release();
            throw dependencyError; 
        }


        // 5. เริ่ม Transaction และดำเนินการลบ
        try {
            await connection.beginTransaction();

            // 5.1 ลบจากตาราง Employee
            const deleteEmployeeResult = await connection.query(
                'DELETE FROM Employee WHERE EmpID = ?',
                [empId]
            );
            
            if (!deleteEmployeeResult || typeof deleteEmployeeResult !== 'object') {
                 await connection.rollback();
                 throw new Error('Unexpected result type from DELETE Employee query.');
            }
            if (deleteEmployeeResult.affectedRows === 0) {
                 await connection.rollback();
                 throw new Error(`Failed to delete employee record for EmpID ${empId}. No rows affected.`);
            }

            // 6. Commit Transaction
            await connection.commit();

            // 7. ส่ง Response สำเร็จ
            res.sendStatus(204);

        } catch (deleteError) {
             if (connection) {
                 try { await connection.rollback(); } catch (rbErr) { console.error('Rollback failed during delete error:', rbErr); }
             }
             console.error(`Error during deletion process for EmpID ${empId}:`, deleteError);
             throw deleteError; 
        }


    } catch (error) {
        console.error(`Overall error deleting employee with EmpID ${empId}:`, error);

        res.status(500).json({ message: 'Internal Server Error.' });

    } finally {
        // คืน Connection กลับสู่ Pool เสมอ
        if (connection) {
            connection.release();
        }
    }
};

module.exports = deleteEmployee;