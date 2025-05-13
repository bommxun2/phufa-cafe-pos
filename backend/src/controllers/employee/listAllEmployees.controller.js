// backend/controllers/employee/listAllEmployees.controller.js
const db = require('../../utils/database');

/**
 * @desc    List All Employees
 * @route   GET /api/employees
 * @access  Private (Requires admin/owner privileges, bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks (admin/owner)
  // const requestingUser = req.user; // Assuming JWT middleware sets req.user
  // if (requestingUser.role !== 'ผู้จัดการ' && requestingUser.role !== 'owner') { // Adjust roles as needed
  //    return res.status(403).json({ message: "Admin or owner privileges required to list employees." });
  // }

  try {
    // Exclude password hash from the result
    const employees = await db.query(
      `SELECT e.EmpID as empId, p.CitizenID as citizenId, p.FirstName as firstname, p.LastName as lastname, 
              p.Gender as gender, p.PhoneNum as phoneNum, p.Address as address, p.ProfileURL as profileUrl,
              e.EmpRole as empRole, e.EmpSalary as empSalary
       FROM Employee e
       JOIN Person p ON e.CitizenID = p.CitizenID`,
    );
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error listing all employees:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving employees.',
    });
  }
};
