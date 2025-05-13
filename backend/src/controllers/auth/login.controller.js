// backend/controllers/auth/login.controller.js
const pool = require('../../utils/database'); // Changed from db to pool
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const dotenv = require('dotenv');

dotenv.config({path: '.env'}); // Ensure .env is loaded

const JWT_SECRET = process.env.APP_SECRET || 'your-very-strong-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '16h';

/**
 * @description Controller for Employee Login (POST /api/auth/login)
 * @param {import('express').Request} req Request object
 * @param {import('express').Response} res Response object
 * @param {import('express').NextFunction} next Next function (optional, if you plan to use error handling middleware)
 */
module.exports = async (req, res, next) => {
  // 1. ดึงข้อมูลจาก Request Body
  const {empId, password} = req.body;

  // 2. ตรวจสอบข้อมูลเบื้องต้น
  if (!empId || !password) {
    return res
      .status(400)
      .json({message: 'Bad Request - Missing empId or password.'});
  }

  let connection;
  try {
    connection = await pool.getConnection(); // Get a connection from the pool

    // 3. Query for employee with name by EmpID
    const employeeQuery =
      'SELECT EmpID, EmpPasswordHash, EmpRole, Person.CitizenID, FirstName, LastName FROM Employee INNER JOIN Person ON Person.CitizenID = Employee.CitizenID WHERE EmpID = ? LIMIT 1';
    const rows = await connection.query(employeeQuery, [empId]);
    
    if (!rows || rows.length === 0) {
      return res
        .status(401)
        .json({message: 'Unauthorized - Invalid employee ID or password.'});
    }

    const employee = rows[0];

    // 4. Verify password
    const validPassword = await argon2.verify(
      employee.EmpPasswordHash,
      password, {
        secret: Buffer.from(process.env.APP_SECRET, 'utf8'),
      }
    );

    console.log('Valid Password:', validPassword); // Debugging line

    if (!validPassword) {
      return res
        .status(401)
        .json({message: 'XUnauthorized - Invalid employee ID or password.'});
    }

    // 5. Generate JWT
    const payload = {
      empId: employee.EmpID,
      role: employee.EmpRole,
      citizenId: employee.CitizenID,
      name: employee.FirstName + ' ' + employee.LastName,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 6. Send Response
    res.status(200).json({
      message: 'Login successful.',
      accessToken,
      tokenType: 'Bearer',
      employee: {
        // Optionally return some non-sensitive employee info
        empId: employee.EmpID,
        role: employee.EmpRole,
        name: employee.FirstName + ' ' + employee.LastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    // Pass to an error handling middleware if 'next' is used
    // if (next) {
    //   return next(error);
    // }
    res.status(500).json({
      message: 'Internal Server Error - An error occurred during login.',
    });
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
};
