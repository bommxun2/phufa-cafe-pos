// backend/controllers/employee/getEmployeeById.controller.js
const db = require('../../utils/database');

/**
 * @desc    Get Employee by ID
 * @route   GET /api/employees/:empId
 * @access  Private (Requires admin/owner privileges or self-access, bearerAuth)
 */
module.exports = async (req, res) => {
  const {empId} = req.params;
  // TODO: Implement authentication/authorization checks
  // const requestingUser = req.user; // Assuming JWT middleware sets req.user
  // if (requestingUser.role !== 'ผู้จัดการ' && requestingUser.role !== 'owner' && requestingUser.empId !== empId) {
  //    return res.status(403).json({ message: "Access denied. You can only view your own profile or require admin privileges." });
  // }

  try {
    const employeeData = await db.query(
      `SELECT e.EmpID as empId, p.CitizenID as citizenId, p.FirstName as firstname, p.LastName as lastname, 
              p.Gender as gender, p.PhoneNum as phoneNum, p.Address as address, p.ProfileURL as profileUrl,
              e.EmpRole as empRole, e.EmpSalary as empSalary
       FROM Employee e
       JOIN Person p ON e.CitizenID = p.CitizenID
       WHERE e.EmpID = ?`,
      [empId],
    );

    if (!employeeData || employeeData.length === 0) {
      return res
        .status(404)
        .json({message: `Employee with ID '${empId}' not found.`});
    }

    res.status(200).json(employeeData[0]);
  } catch (error) {
    console.error(`Error retrieving employee ${empId}:`, error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving the employee.',
    });
  }
};
