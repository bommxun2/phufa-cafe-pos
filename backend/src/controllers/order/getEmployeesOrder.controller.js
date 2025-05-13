const db = require('../../utils/database');

module.exports = async (req, res) => {
  const {empId} = req.params;

  if (!empId || !/^\w{1,10}$/.test(empId)) {
    return res.status(400).json({error: 'Invalid employee ID format'});
  }

  try {
    const rows = await db.query(
      `
            SELECT 
                o.OrderID,
                o.OrderDateTime,
                o.OrderStatus,
                o.OrderPrice,
                o.EmpID,
                o.CitizenID,
                oi.OrderItemID,
                oi.MenuID,
                oi.Quantity,
                oi.Note,
                oi.ItemBasePrice,
                oi.CustomizeCost,
                oi.ItemTotalPrice,
                ci.IngredientID,
                ci.CustomizationCost
            FROM \`Order\` o
            LEFT JOIN OrderItem oi ON o.OrderID = oi.OrderID
            LEFT JOIN CustomIngredient ci ON oi.OrderItemID = ci.OrderItemID
            WHERE o.EmpID = ?
            ORDER BY o.OrderDateTime DESC;
        `,
      [empId],
    );

    const orderMap = {};

    for (const row of rows) {
      if (!orderMap[row.OrderID]) {
        orderMap[row.OrderID] = {
          orderId: row.OrderID,
          orderDateTime: row.OrderDateTime,
          orderStatus: !!row.OrderStatus,
          orderPrice: Number(row.OrderPrice),
          orderMakerEmpId: row.EmpID,
          orderByCitizenId: row.CitizenID,
          orderItems: [],
        };
      }

      const order = orderMap[row.OrderID];

      let item = order.orderItems.find(i => i.orderItemId === row.OrderItemID);
      if (!item && row.OrderItemID) {
        item = {
          orderItemId: row.OrderItemID,
          menuId: row.MenuID,
          quantity: row.Quantity,
          note: row.Note,
          itemBasePrice: Number(row.ItemBasePrice),
          customizeCost: Number(row.CustomizeCost),
          itemTotalPrice: Number(row.ItemTotalPrice),
          customizations: [],
        };
        order.orderItems.push(item);
      }

      if (item && row.IngredientID) {
        item.customizations.push({
          ingredientId: row.IngredientID,
          customizationCostApplied: Number(row.CustomizationCost),
        });
      }
    }

    res.json(Object.values(orderMap));
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({
      message: 'An unexpected error occurred while retrieving employee orders.',
    });
  }
};
