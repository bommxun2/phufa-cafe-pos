// backend/controllers/order/getOrderById.controller.js
const db = require('../../utils/database');

/**
 * @desc    Get Order by ID
 * @route   GET /api/orders/:orderId
 * @access  Private (Requires bearerAuth)
 */
module.exports = async (req, res) => {
  // TODO: Implement authentication/authorization checks

  const {orderId} = req.params;

  try {
    const orderData = await db.query(
      'SELECT OrderID as orderId, OrderDateTime as orderDateTime, OrderStatus as orderStatus, OrderPrice as orderPrice, EmpID as orderMakerEmpId, CitizenID as orderByCitizenId FROM `Order` WHERE OrderID = ?',
      [orderId],
    );

    if (!orderData || orderData.length === 0) {
      return res
        .status(404)
        .json({message: `Order with ID '${orderId}' not found.`});
    }

    const order = orderData[0];

    // Fetch order items
    const orderItemsData = await db.query(
      `SELECT oi.OrderItemID as orderItemId, oi.MenuID as menuId, m.MenuName as menuName,
              oi.Quantity as quantity, oi.Note as note, oi.ItemBasePrice as itemBasePrice, 
              oi.CustomizeCost as customizeCost, oi.ItemTotalPrice as itemTotalPrice
       FROM OrderItem oi
       JOIN Menu m ON oi.MenuID = m.MenuID
       WHERE oi.OrderID = ?`,
      [orderId],
    );

    const fullOrderItems = [];
    for (const item of orderItemsData) {
      const customizations = await db.query(
        `SELECT ci.IngredientID as ingredientId, i.Name as ingredientName, 
                    ci.CustomizationCost as customizationCostApplied
             FROM CustomIngredient ci 
             JOIN Ingredient i ON ci.IngredientID = i.IngredientID
             WHERE ci.OrderItemID = ?`,
        [item.orderItemId],
      );
      fullOrderItems.push({...item, customizations});
    }

    res.status(200).json({
      ...order,
      orderStatus: !!order.orderStatus, // Ensure boolean
      orderItems: fullOrderItems,
    });
  } catch (error) {
    console.error(`Error retrieving order ${orderId}:`, error);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving the order.',
    });
  }
};
