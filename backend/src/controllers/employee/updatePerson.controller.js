/**
 * @description อัปเดตข้อมูลในตาราง Person 
 * @param {import('mysql2/promise').PoolConnection} connection 
 * @param {string} citizenId - Citizen ID ของ Person ที่จะอัปเดต
 * @param {object} personData - Object ที่มีข้อมูล Person ที่จะอัปเดต 
 * @throws {Error} 
 */
const updateExistingPerson = async (connection, citizenId, personData) => {
    const { firstname, lastname, gender, phoneNum, address, profileUrl } = personData;

    const setClauses = [];
    const values = [];

    // Mapping และสร้าง SET clause (เฉพาะ field ที่มีค่าส่งมา)
    const dataToUpdate = { FirstName: firstname, LastName: lastname, Gender: gender, PhoneNum: phoneNum, Address: address, ProfileURL: profileUrl };

    for (const dbField in dataToUpdate) {
        if (Object.prototype.hasOwnProperty.call(dataToUpdate, dbField) && dataToUpdate[dbField] !== undefined) {
             // ตรวจสอบ PhoneNum ซ้ำก่อนเพิ่ม ถ้าเป็น PhoneNum
             if (dbField === 'PhoneNum' && dataToUpdate[dbField] !== null) {
                 console.log(`--- (UpdatePerson) Checking uniqueness for PhoneNum: ${dataToUpdate[dbField]}, excluding CitizenID: ${citizenId}`);
                 const queryResultPhoneCheck = await connection.query(
                     'SELECT 1 FROM Person WHERE PhoneNum = ? AND CitizenID != ? LIMIT 1',
                     [dataToUpdate[dbField], citizenId]
                 );

                 let duplicateFound = false;
                 // --- Logic ตรวจสอบผลลัพธ์ Query ---
                  if (typeof queryResultPhoneCheck === 'object' && queryResultPhoneCheck !== null) {
                     if (!Array.isArray(queryResultPhoneCheck)) { duplicateFound = true; }
                     else {
                         if (queryResultPhoneCheck.length > 0) {
                             if (Array.isArray(queryResultPhoneCheck[0])) {
                                 if (queryResultPhoneCheck.length === 2 && Array.isArray(queryResultPhoneCheck[1])) { duplicateFound = queryResultPhoneCheck[0].length > 0; }
                                 else { duplicateFound = true; }
                             } else if (typeof queryResultPhoneCheck[0] === 'object') { duplicateFound = true; }
                         }
                     }
                 }

                 if (duplicateFound) {
                      console.error(`--- (UpdatePerson) Duplicate PhoneNum ${dataToUpdate[dbField]} detected.`);
                      throw new Error('Bad Request - Phone number already registered by another person.');
                 }
                  console.log(`--- (UpdatePerson) PhoneNum ${dataToUpdate[dbField]} appears unique.`);
             }
             
            setClauses.push(`${dbField} = ?`);
            values.push(dataToUpdate[dbField]);
        }
    }

    if (setClauses.length === 0) {
        console.log(`--- (UpdatePerson) No fields to update for CitizenID: ${citizenId}`);
        return;
    }

    // สร้างและ Execute คำสั่ง UPDATE
    values.push(citizenId);
    const updateQuery = `UPDATE Person SET ${setClauses.join(', ')} WHERE CitizenID = ?`;
    console.log(`--- (UpdatePerson) Executing: ${updateQuery} with values: ${JSON.stringify(values)}`);

    const updateResult = await connection.query(updateQuery, values);

    // ตรวจสอบผลลัพธ์ UPDATE (Optional แต่แนะนำ)
    if (!updateResult || typeof updateResult !== 'object' || updateResult.affectedRows === 0) {
         // อาจจะเกิดถ้า CitizenID หายไปพอดี หรือมีปัญหาอื่น
         console.error(`--- (UpdatePerson) Failed to update Person for CitizenID: ${citizenId}. Result: ${JSON.stringify(updateResult)}`);
         throw new Error(`Failed to update person record for CitizenID ${citizenId}. No rows affected or unexpected result.`);
    }

    console.log(`--- (UpdatePerson) Successfully updated Person for CitizenID: ${citizenId}. Rows affected: ${updateResult.affectedRows}`);
};

module.exports = { updateExistingPerson };