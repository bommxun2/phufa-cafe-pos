const pool = require("../../utils/database"); // Adjust path as needed

module.exports = async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body; // Expecting a boolean

  if (typeof orderStatus !== "boolean") {
    return res
      .status(400)
      .json({ message: "Invalid orderStatus value. Must be boolean." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [currentOrderRows] = await connection.execute(
      "SELECT OrderStatus FROM `Order` WHERE OrderID = ?",
      [orderId]
    );
    if (currentOrderRows.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: `Order with ID '${orderId}' not found.` });
    }
    const currentOrder = currentOrderRows;
    const currentDbStatus = Boolean(currentOrder.OrderStatus);

    // Update Order status
    await connection.execute(
      "UPDATE `Order` SET OrderStatus = ? WHERE OrderID = ?",
      [orderStatus, orderId]
    );

    // If orderStatus is being set to true (paid) AND was not already true
    if (orderStatus === true && currentDbStatus === false) {
      const orderItems = await connection.execute(
        "SELECT OrderItemID, MenuID, Quantity FROM OrderItem WHERE OrderID = ?",
        [orderId]
      );

      console.log("Order Items:", orderItems);

      for (const item of orderItems) {
        const orderItemTotalQuantity = item.Quantity;

        // 1. Deduct ingredients from DefaultRecipe
        const defaultRecipeItems = await connection.execute(
          "SELECT IngredientID, Quantity FROM DefaultRecipe WHERE MenuID = ?",
          [item.MenuID]
        );
        for (const drItem of defaultRecipeItems) {
          const quantityToDeduct =
            parseFloat(drItem.Quantity) * orderItemTotalQuantity;
          const [ingCheck] = await connection.execute(
            "SELECT Quantity FROM Ingredient WHERE IngredientID = ?",
            [drItem.IngredientID]
          );
          if (ingCheck.length > 0 && ingCheck[0].Quantity < quantityToDeduct) {
            await connection.rollback();
            return res.status(400).json({
              message: `Insufficient stock for ingredient ID ${drItem.IngredientID} for menu ID ${item.MenuID}.`,
            });
          }
          await connection.execute(
            "UPDATE Ingredient SET Quantity = Quantity - ? WHERE IngredientID = ?",
            [quantityToDeduct, drItem.IngredientID]
          );
        }

        // 2. Deduct ingredients from CustomIngredient
        const customIngredients = await connection.execute(
          "SELECT IngredientID, Quantity FROM CustomIngredient WHERE OrderItemID = ?",
          [item.OrderItemID]
        );
        for (const ciItem of customIngredients) {
          const quantityToDeduct =
            parseFloat(ciItem.Quantity) * orderItemTotalQuantity;
          const [ingCheck] = await connection.execute(
            "SELECT Quantity FROM Ingredient WHERE IngredientID = ?",
            [ciItem.IngredientID]
          );
          if (ingCheck.length > 0 && ingCheck[0].Quantity < quantityToDeduct) {
            await connection.rollback();
            return res.status(400).json({
              message: `Insufficient stock for custom ingredient ID ${ciItem.IngredientID} for order item ID ${item.OrderItemID}.`,
            });
          }
          await connection.execute(
            "UPDATE Ingredient SET Quantity = Quantity - ? WHERE IngredientID = ?",
            [quantityToDeduct, ciItem.IngredientID]
          );
        }
      }
    }

    await connection.commit();

    // Fetch the fully updated order to return
    const updatedOrderRows = await connection.execute(
      "SELECT OrderID, OrderDateTime, OrderStatus, OrderPrice, EmpID, CitizenID FROM `Order` WHERE OrderID = ?",
      [orderId]
    );
    if (updatedOrderRows.length === 0) {
      // Should not happen if update was successful, but good for safety
      return res.status(404).json({
        message: `Order with ID '${orderId}' not found after update.`,
      });
    }

    const updatedOrderData = updatedOrderRows[0];

    const updatedOrderItemsRows = await connection.execute(
      `SELECT oi.OrderItemID, oi.MenuID, oi.Quantity, oi.Note, oi.ItemBasePrice, oi.CustomizeCost, oi.ItemTotalPrice 
             FROM OrderItem oi 
             WHERE oi.OrderID = ?`,
      [orderId]
    );

    const finalOrderItems = [];
    for (const oi of updatedOrderItemsRows) {
      const customizationsRows = await connection.execute(
        `SELECT ci.IngredientID, ci.CustomizationCost as customizationCostApplied 
                 FROM CustomIngredient ci 
                 WHERE ci.OrderItemID = ?`,
        [oi.OrderItemID]
      );
      finalOrderItems.push({
        orderItemId: oi.OrderItemID,
        menuId: oi.MenuID,
        quantity: oi.Quantity,
        note: oi.Note,
        itemBasePrice: parseFloat(oi.ItemBasePrice),
        customizeCost: parseFloat(oi.CustomizeCost),
        itemTotalPrice: parseFloat(oi.ItemTotalPrice),
        customizations: customizationsRows.map((c) => ({
          ingredientId: c.IngredientID,
          customizationCostApplied: parseFloat(c.customizationCostApplied),
        })),
      });
    }

    const responseOrder = {
      orderId: updatedOrderData.OrderID,
      orderDateTime: new Date(updatedOrderData.OrderDateTime).toISOString(),
      orderStatus: Boolean(updatedOrderData.OrderStatus),
      orderPrice: parseFloat(updatedOrderData.OrderPrice),
      orderMakerEmpId: updatedOrderData.EmpID,
      orderByCitizenId: updatedOrderData.CitizenID,
      orderItems: finalOrderItems,
    };

    res.status(200).json(responseOrder);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "An unexpected error occurred while updating the order status.",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
