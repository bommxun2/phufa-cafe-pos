// backend/controllers/customer/getCustomerById.controller.js
const db = require('../../utils/database');

/**
 * @desc    Get Customer by ID (Citizen ID)
 * @route   GET /api/customers/:customerId
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication check

  const {customerId} = req.params; // This is CitizenID

  if (!/^\d{13}$/.test(customerId)) {
    return res.status(400).json({
      message: 'Invalid customerId (Citizen ID) format. Must be 13 digits.',
    });
  }

  try {
    const customerData = await db.query(
      `SELECT p.CitizenID as citizenId, p.FirstName as firstname, p.LastName as lastname, 
              p.Gender as gender, p.PhoneNum as phoneNum, p.Address as address, p.ProfileURL as profileUrl,
              c.Point as point
       FROM Customer c
       JOIN Person p ON c.CitizenID = p.CitizenID
       WHERE c.CitizenID = ?`,
      [customerId],
    );

    if (!customerData || customerData.length === 0) {
      return res.status(404).json({
        message: `Customer with Citizen ID '${customerId}' not found.`,
      });
    }

    res.status(200).json(customerData[0]);
  } catch (error) {
    console.error(`Error retrieving customer ${customerId}:`, error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving the customer.',
    });
  }
};
