// Get all orders for a specific employee
module.exports = (req, res) => {
    const { empId } = req.params;
    
    // Validate employee ID format
    if (!empId || !/^\d{10}$/.test(empId)) {
        return res.status(400).json({
            error: 'Invalid employee ID format'
        });
    }

    // TODO: Replace with actual database query
    // This is a mock response
    res.json([
        {
            orderId: 'O265980000',
            orderDateTime: '2024-03-21T00:18:00+07:00',
            orderStatus: true,
            orderPrice: 195,
            orderMakerEmpId: empId,
            orderByCitizenId: '1266985663999',
            orderItems: [
                {
                    orderItemId: 'OI26598000',
                    menuId: 'M213560000',
                    quantity: 2,
                    note: 'Extra hot',
                    itemBasePrice: 55,
                    customizeCost: 20,
                    itemTotalPrice: 130,
                    customizations: [
                        {
                            ingredientId: 'I985630000',
                            customizationCostApplied: 10
                        }
                    ]
                }
            ]
        }
    ]);
};
