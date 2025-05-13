// backend/controllers/order/listAllOrders.controller.js
const db = require('../../utils/database');

/**
 * @desc    List All Orders
 * @route   GET /api/orders
 * @access  Private (Requires admin/owner privileges, bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks (admin/owner)

  const {status, employeeId} = req.query;

  try {
    let baseQuery = `
      SELECT 
        o.OrderID as orderId, 
        o.OrderDateTime as orderDateTime, 
        o.OrderStatus as orderStatus, 
        o.OrderPrice as orderPrice, 
        o.EmpID as orderMakerEmpId, 
        o.CitizenID as orderByCitizenId
      FROM \`Order\` o
    `;
    const conditions = [];
    const queryParams = [];

    if (typeof status !== 'undefined') {
      conditions.push('o.OrderStatus = ?');
      queryParams.push(status === 'true' || status === true ? 1 : 0);
    }
    if (employeeId) {
      conditions.push('o.EmpID = ?');
      queryParams.push(employeeId);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }
    baseQuery += ' ORDER BY o.OrderDateTime DESC';

    const orders = await db.query(baseQuery, queryParams);

    const resultOrders = [];
    for (const order of orders) {
      const items = await db.query(
        `SELECT 
                oi.OrderItemID as orderItemId, oi.MenuID as menuId, m.MenuName as menuName,
                oi.Quantity as quantity, oi.Note as note, oi.ItemBasePrice as itemBasePrice, 
                oi.CustomizeCost as customizeCost, oi.ItemTotalPrice as itemTotalPrice
             FROM OrderItem oi
             JOIN Menu m ON oi.MenuID = m.MenuID
             WHERE oi.OrderID = ?`,
        [order.orderId],
      );

      const orderItemsWithCustomizations = [];
      for (const item of items) {
        const customizations = await db.query(
          `SELECT 
                    ci.IngredientID as ingredientId, ing.Name as ingredientName,
                    ci.CustomizationCost as customizationCostApplied 
                    -- Removed ci.Quantity as it's not in CustomIngredientDetail schema
                 FROM CustomIngredient ci
                 JOIN Ingredient ing ON ci.IngredientID = ing.IngredientID
                 WHERE ci.OrderItemID = ?`,
          [item.orderItemId],
        );
        orderItemsWithCustomizations.push({...item, customizations});
      }
      resultOrders.push({
        ...order,
        orderStatus: !!order.orderStatus, // Ensure boolean
        orderItems: orderItemsWithCustomizations,
      });
    }

    res.status(200).json(resultOrders);
  } catch (error) {
    console.error('Error listing all orders:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving orders.',
    });
  }
};
