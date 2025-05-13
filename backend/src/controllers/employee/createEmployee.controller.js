const pool = require('../../utils/database');
const argon2 = require('argon2');
const dotenv = require('dotenv');
const {updateExistingPerson} = require('../employee/updatePerson.controller');

dotenv.config({path: '.env'});

/**
 * @description Controller สำหรับสร้างพนักงานใหม่ (POST /employees)
 *            - ถ้า CitizenID ไม่มี: สร้าง Person ใหม่ + สร้าง Employee ใหม่
 *            - ถ้า CitizenID มีอยู่แล้ว: อัปเดต Person ที่มีอยู่ + สร้าง Employee ใหม่
 * @param {import('express').Request} req Request object
 * @param {import('express').Response} res Response object
 * @param {import('express').NextFunction} next Next function
 */
const createEmployee = async (req, res, next) => {
  // 1. ดึงข้อมูลจาก Request Body
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
    password,
  } = req.body;

  // 2. ตรวจสอบข้อมูลเบื้องต้น
  if (
    !citizenId ||
    !firstname ||
    !lastname ||
    !phoneNum ||
    !empId ||
    !empRole ||
    !empSalary ||
    !password
  ) {
    return res
      .status(400)
      .json({message: 'Bad Request - Missing required fields.'});
  }
  if (!/^\d{13}$/.test(citizenId)) {
    return res.status(400).json({
      message: 'Bad Request - Invalid Citizen ID format (must be 13 digits).',
    });
  }
  if (typeof empId !== 'string' || empId.length === 0 || empId.length > 10) {
    return res.status(400).json({
      message: 'Bad Request - Invalid Employee ID format (max 10 chars).',
    });
  }
  // --- ใช้ Regex ที่รองรับ 9 หรือ 10 หลัก ---
  if (!/^\d{10}$/.test(phoneNum)) {
    return res.status(400).json({
      message: 'Bad Request - Invalid Phone Number format (must be 10 digits).',
    });
  }
  if (password.length < 8) {
    // ควรมี Validation ความยาว Password ด้วย
    return res.status(400).json({
      message: 'Bad Request - Password must be at least 8 characters long.',
    });
  }

  let connection;
  try {
    // 3. Hash Password
    const passwordHash = await argon2.hash(password, {
      hashLength: 32,
      memoryCost: 5120,
      timeCost: 2,
      parallelism: 1,
      type: argon2.argon2d,
      version: 19,
      secret: Buffer.from(process.env.APP_SECRET, 'utf8'),
    });

    // Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 4. ตรวจสอบข้อมูลซ้ำที่เกี่ยวกับ Employee ก่อน
    // 4.1 Check EmpID uniqueness in Employee table
    try {
      const queryResultEmpId = await connection.query(
        'SELECT 1 FROM Employee WHERE EmpID = ? LIMIT 1',
        [empId],
      );
      let empIdExists = false;
      if (typeof queryResultEmpId === 'object' && queryResultEmpId !== null) {
        if (!Array.isArray(queryResultEmpId)) {
          empIdExists = true;
        } else if (queryResultEmpId.length > 0) {
          if (Array.isArray(queryResultEmpId[0])) {
            if (
              queryResultEmpId.length === 2 &&
              Array.isArray(queryResultEmpId[1])
            ) {
              empIdExists = queryResultEmpId[0].length > 0;
            } else {
              empIdExists = true;
            }
          } else if (typeof queryResultEmpId[0] === 'object') {
            empIdExists = true;
          }
        }
      }
      if (empIdExists) {
        await connection.rollback();
        connection.release();
        return res
          .status(400)
          .json({message: 'Bad Request - Employee ID already exists.'});
      }
    } catch (queryError) {
      console.error(`Error checking EmpID ${empId}:`, queryError);
      throw queryError;
    } // โยนต่อให้ catch หลัก

    // 4.2 Check CitizenID uniqueness in Employee table
    try {
      const queryResultEmpCitizen = await connection.query(
        'SELECT 1 FROM Employee WHERE CitizenID = ? LIMIT 1',
        [citizenId],
      );
      let empCitizenExists = false;
      if (
        typeof queryResultEmpCitizen === 'object' &&
        queryResultEmpCitizen !== null
      ) {
        if (!Array.isArray(queryResultEmpCitizen)) {
          empCitizenExists = true;
        } else if (queryResultEmpCitizen.length > 0) {
          if (Array.isArray(queryResultEmpCitizen[0])) {
            if (
              queryResultEmpCitizen.length === 2 &&
              Array.isArray(queryResultEmpCitizen[1])
            ) {
              empCitizenExists = queryResultEmpCitizen[0].length > 0;
            } else {
              empCitizenExists = true;
            }
          } else if (typeof queryResultEmpCitizen[0] === 'object') {
            empCitizenExists = true;
          }
        }
      }
      if (empCitizenExists) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message:
            'Bad Request - Citizen ID already registered as an employee.',
        });
      }
    } catch (queryError) {
      console.error(
        `Error checking CitizenID ${citizenId} in Employee:`,
        queryError,
      );
      throw queryError;
    }

    // 5. ตรวจสอบว่า Person มีอยู่หรือไม่
    let personExists = false;
    try {
      const queryResultPersonCheck = await connection.query(
        'SELECT 1 FROM Person WHERE CitizenID = ? LIMIT 1',
        [citizenId],
      );
      if (
        typeof queryResultPersonCheck === 'object' &&
        queryResultPersonCheck !== null
      ) {
        if (!Array.isArray(queryResultPersonCheck)) {
          personExists = true;
        } else if (queryResultPersonCheck.length > 0) {
          if (Array.isArray(queryResultPersonCheck[0])) {
            if (
              queryResultPersonCheck.length === 2 &&
              Array.isArray(queryResultPersonCheck[1])
            ) {
              personExists = queryResultPersonCheck[0].length > 0;
            } else {
              personExists = true;
            }
          } else if (typeof queryResultPersonCheck[0] === 'object') {
            personExists = true;
          }
        }
      }
    } catch (queryError) {
      console.error(
        `Error checking Person existence for ${citizenId}:`,
        queryError,
      );
      throw queryError;
    }

    // 6. ดำเนินการตามเงื่อนไข Person Existence
    if (personExists) {
      // Scenario 2: Person มีอยู่แล้ว -> Update Person
      console.log(`--- Person with CitizenID ${citizenId} exists. Updating...`);
      try {
        await updateExistingPerson(connection, citizenId, {
          firstname,
          lastname,
          gender,
          phoneNum,
          address,
          profileUrl,
        });
      } catch (updateError) {
        console.error(
          `Error updating existing person ${citizenId} via service:`,
          updateError,
        );
        throw updateError;
      }
    } else {
      // Scenario 1: Person ยังไม่มี -> Insert Person
      console.log(
        `--- Person with CitizenID ${citizenId} does not exist. Creating...`,
      );
      // 6.1 ตรวจสอบ PhoneNum ซ้ำก่อน Insert (เฉพาะกรณีสร้างใหม่)
      try {
        const queryResultPhone = await connection.query(
          'SELECT 1 FROM Person WHERE PhoneNum = ? LIMIT 1',
          [phoneNum],
        );
        let phoneExists = false;
        if (typeof queryResultPhone === 'object' && queryResultPhone !== null) {
          if (!Array.isArray(queryResultPhone)) {
            phoneExists = true;
          } else if (queryResultPhone.length > 0) {
            if (Array.isArray(queryResultPhone[0])) {
              if (
                queryResultPhone.length === 2 &&
                Array.isArray(queryResultPhone[1])
              ) {
                phoneExists = queryResultPhone[0].length > 0;
              } else {
                phoneExists = true;
              }
            } else if (typeof queryResultPhone[0] === 'object') {
              phoneExists = true;
            }
          }
        }
        if (phoneExists) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            message: 'Bad Request - Phone number already registered.',
          });
        }
      } catch (queryError) {
        console.error(
          `Error checking PhoneNum ${phoneNum} before insert:`,
          queryError,
        );
        throw queryError;
      }

      // 6.2 Insert Person
      try {
        const personQuery = `INSERT INTO Person (CitizenID, FirstName, LastName, Gender, PhoneNum, Address, ProfileURL) VALUES (?, ?, ?, ?, ?, ?, ?);`;
        const personValues = [
          citizenId,
          firstname,
          lastname,
          gender,
          phoneNum,
          address,
          profileUrl,
        ];
        await connection.query(personQuery, personValues);
        console.log(
          `--- Successfully inserted Person for CitizenID: ${citizenId}`,
        );
      } catch (insertError) {
        console.error(`Error inserting Person for ${citizenId}:`, insertError);
        throw insertError;
      }
    }

    // 7. สร้าง Employee (ทำเสมอหลังจาก Insert/Update Person สำเร็จ)
    try {
      console.log(`--- Inserting Employee record for EmpID: ${empId}`);
      const employeeQuery = `INSERT INTO Employee (EmpID, CitizenID, EmpPasswordHash, EmpRole, EmpSalary) VALUES (?, ?, ?, ?, ?);`;
      const employeeValues = [
        empId,
        citizenId,
        passwordHash,
        empRole,
        empSalary,
      ];
      const insertEmployeeResult = await connection.query(
        employeeQuery,
        employeeValues,
      );

      if (
        !insertEmployeeResult ||
        typeof insertEmployeeResult !== 'object' ||
        insertEmployeeResult.affectedRows !== 1
      ) {
        console.error(
          `--- Failed to insert Employee for EmpID: ${empId}. Result: ${JSON.stringify(insertEmployeeResult)}`,
        );
        throw new Error(`Failed to insert employee record for EmpID ${empId}.`);
      }
      console.log(`--- Successfully inserted Employee for EmpID: ${empId}`);
    } catch (insertEmpError) {
      console.error(`Error inserting Employee for ${empId}:`, insertEmpError);
      if (insertEmpError.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message:
            'Bad Request - Duplicate Employee ID or Citizen ID detected.',
        });
      }
      throw insertEmpError;
    }

    // 8. Commit Transaction
    await connection.commit();

    // 9. SELECT ข้อมูลกลับเพื่อส่ง Response
    let createdEmployeeDataFromDb;
    try {
      const selectQuery = `
                SELECT 
                    p.CitizenID AS citizenId, 
                    p.FirstName AS firstname, 
                    p.LastName AS lastname, 
                    p.Gender AS gender,
                    p.PhoneNum AS phoneNum, 
                    p.Address AS address, 
                    p.ProfileURL AS profileUrl, 
                    e.EmpID AS empId,
                    e.EmpRole AS empRole, 
                    e.EmpSalary AS empSalary
                FROM Person p JOIN Employee e ON p.CitizenID = e.CitizenID WHERE e.EmpID = ?;`;
      const queryResultSelect = await connection.query(selectQuery, [empId]);
      let employeeRows = [];
      if (typeof queryResultSelect === 'object' && queryResultSelect !== null) {
        if (!Array.isArray(queryResultSelect)) {
          employeeRows = [queryResultSelect];
        } else if (queryResultSelect.length > 0) {
          if (Array.isArray(queryResultSelect[0])) {
            if (
              queryResultSelect.length === 2 &&
              Array.isArray(queryResultSelect[1])
            ) {
              employeeRows = queryResultSelect[0];
            }
          } else if (typeof queryResultSelect[0] === 'object') {
            employeeRows = queryResultSelect;
          }
        }
      }

      if (!employeeRows || employeeRows.length === 0) {
        console.error(
          `CRITICAL: Failed to retrieve employee ${empId} immediately after commit.`,
        );
        throw new Error(
          'Internal Server Error - Could not verify employee creation status after commit.',
        );
      }
      createdEmployeeDataFromDb = employeeRows[0];
      if (
        createdEmployeeDataFromDb &&
        typeof createdEmployeeDataFromDb.empSalary === 'string'
      ) {
        createdEmployeeDataFromDb.empSalary = parseFloat(
          createdEmployeeDataFromDb.empSalary,
        );
      }
    } catch (selectError) {
      console.error(
        `Error selecting newly created/updated employee ${empId}:`,
        selectError,
      );
      throw selectError;
    }

    // 10. ส่ง Response กลับ
    res.status(201).json(createdEmployeeDataFromDb);
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Rollback failed in main catch block:', rbErr);
      }
    }
    console.error('Overall error in createEmployee:', error);

    if (
      error.message &&
      error.message.startsWith('Bad Request - Phone number')
    ) {
      return res.status(400).json({message: error.message});
    }

    if (
      error.message &&
      error.message.startsWith('Internal Server Error - Could not verify')
    ) {
      return res.status(500).json({message: error.message});
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message:
          'Bad Request - Duplicate Employee ID or Citizen ID detected by database.',
      });
    }

    res.status(500).json({message: 'Internal Server Error.'});
  } finally {
    // คืน Connection กลับสู่ Pool
    if (connection) {
      connection.release();
    }
  }
};

module.exports = createEmployee;
