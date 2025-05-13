const pool = require('../../utils/database.js');

/**
 * @description แก้ไขข้อมูลลูกค้า
 * @route PUT /api/customers/:customerId
 * @access Private (ปรับตามต้องการ)
 */
const updateCustomerController = async (req, res, next) => {
  const customerId = req.params.customerId; // นี่คือ CitizenID
  const updateData = req.body;

  // --- Basic Validation ---
  if (customerId.length !== 13 || !/^\d+$/.test(customerId)) {
    return res.status(400).json({
      message: 'Invalid Customer ID format in URL (must be 13 digits)',
    });
  }
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({message: 'No update data provided.'});
  }
  // ... (validation อื่นๆ สำหรับ field ที่ส่งมา)

  let conn;
  try {
    // 1. ขอ Connection
    conn = await pool.getConnection();
    console.log('DB Connection obtained for updating customer');

    // 2. ตรวจสอบว่ามี Customer (Person) นี้อยู่จริงหรือไม่
    const existingPerson = await conn.query(
      'SELECT CitizenID FROM Person WHERE CitizenID = ? LIMIT 1',
      [customerId],
    );
    if (
      !existingPerson ||
      existingPerson.length === 0 ||
      !existingPerson[0]?.CitizenID
    ) {
      // ใช้ Optional chaining ?.
      await conn.release();
      console.log('DB Connection released - Customer not found');
      return res.status(404).json({message: 'Customer not found.'});
    }

    // 3. (Optional) ตรวจสอบ PhoneNum ซ้ำ ถ้ามีการส่ง phoneNum มาแก้ไข
    if (updateData.phoneNum) {
      const duplicatePhone = await conn.query(
        'SELECT CitizenID FROM Person WHERE PhoneNum = ? AND CitizenID != ? LIMIT 1',
        [updateData.phoneNum, customerId],
      );
      if (
        duplicatePhone &&
        duplicatePhone.length > 0 &&
        duplicatePhone[0]?.CitizenID
      ) {
        // ใช้ Optional chaining ?.
        await conn.release();
        console.log('DB Connection released - Duplicate phone number');
        return res
          .status(400)
          .json({message: 'Phone number already used by another customer.'});
      }
    }

    // 4. สร้างส่วนของ SQL UPDATE แบบ Dynamic
    const allowedFields = {
      firstname: 'FirstName',
      lastname: 'LastName',
      gender: 'Gender',
      phoneNum: 'PhoneNum',
      address: 'Address',
      profileUrl: 'ProfileURL',
    };
    let updateFields = [];
    let updateValues = [];

    for (const key in updateData) {
      if (allowedFields[key] && updateData[key] !== undefined) {
        updateFields.push(`${allowedFields[key]} = ?`);
        updateValues.push(updateData[key]);
      }
    }

    if (updateFields.length === 0) {
      await conn.release();
      console.log('DB Connection released - No valid fields to update');
      return res
        .status(400)
        .json({message: 'No valid fields to update provided.'});
    }

    // 5. ทำการ Update ข้อมูลในตาราง Person
    const updateQuery = `UPDATE Person SET ${updateFields.join(', ')} WHERE CitizenID = ?`;
    updateValues.push(customerId);

    const updateResult = await conn.query(updateQuery, updateValues);
    console.log(
      `Person updated for ${customerId}, affected rows:`,
      updateResult.affectedRows,
    );

    // 6. ดึงข้อมูลลูกค้าล่าสุด (Join Person & Customer) เพื่อส่งกลับ
    const updatedCustomerData = await conn.query(
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
      [customerId],
    );

    if (!updatedCustomerData || updatedCustomerData.length === 0) {
      console.error(
        `Failed to retrieve updated customer data for ID: ${customerId}`,
      );
      return res
        .status(500)
        .json({message: 'Internal error retrieving updated customer data.'});
    }

    console.log(`Customer updated successfully: ${customerId}`);
    res.status(200).json(updatedCustomerData[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res
      .status(500)
      .json({message: 'Error updating customer', error: error.message});
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('DB Connection released');
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
};

module.exports = updateCustomerController;
