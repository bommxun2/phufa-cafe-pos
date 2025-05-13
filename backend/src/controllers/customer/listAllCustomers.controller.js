// backend/controllers/customer/listAllCustomers.controller.js
const db = require('../../utils/database');

/**
 * @desc    List All Customers
 * @route   GET /api/customers
 * @access  Private (Requires admin/owner privileges, bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks (admin/owner)

  try {
    const customers = await db.query(
      `SELECT p.CitizenID as citizenId, p.FirstName as firstname, p.LastName as lastname, 
              p.Gender as gender, p.PhoneNum as phoneNum, p.Address as address, p.ProfileURL as profileUrl,
              c.Point as point
       FROM Customer c
       JOIN Person p ON c.CitizenID = p.CitizenID`,
    );
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error listing all customers:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving customers.',
    });
  }
};
