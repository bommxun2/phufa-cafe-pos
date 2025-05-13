const pool = require("../../utils/database");
const {
  generateOrderId,
  generateOrderItemId,
} = require("../../utils/idGenerator");

// --- Helper Function ---
async function processOrderItem(item, orderId, connection) {
  // Validate item data
  if (!item.menuId || typeof item.quantity !== "number" || item.quantity <= 0) {
    return {
      error: "Invalid item data: menuId and positive quantity required.",
    };
  }

  // Fetch menu item details
  const menuItemRows = await connection.execute(
    'SELECT MenuPrice, MenuName FROM Menu WHERE MenuID = ? AND MenuStatus = "พร้อมขาย"',
    [item.menuId]
  );
  if (menuItemRows.length === 0) {
    return {
      error: `Menu item with ID ${item.menuId} not found or not available.`,
    };
  }
  const menuItem = menuItemRows;
  const itemBasePrice = parseFloat(menuItem.MenuPrice);
  let currentItemCustomizeCostPerUnit = 0;
  const customizationsForDb = [];
  const customizationsForResponse = [];

  // Process customizations
  if (item.customizations && Array.isArray(item.customizations)) {
    for (const cust of item.customizations) {
      if (!cust.ingredientId) {
        return { error: "Invalid customization: ingredientId required." };
      }
      const [ingredientRows] = await connection.execute(
        "SELECT AdjustmentPrice, Name FROM Ingredient WHERE IngredientID = ?",
        [cust.ingredientId]
      );
      if (ingredientRows.length === 0) {
        return {
          error: `Customization ingredient with ID ${cust.ingredientId} not found.`,
        };
      }
      const customizationIngredient = ingredientRows;
      const customizationCostApplied = parseFloat(
        customizationIngredient.AdjustmentPrice
      );
      currentItemCustomizeCostPerUnit += customizationCostApplied;

      // Assuming quantity for custom ingredient in recipe context is always 1
      const customIngredientQuantityForRecipe = 1;

      customizationsForDb.push({
        ingredientId: cust.ingredientId,
        quantity: customIngredientQuantityForRecipe,
        customizationCost: customizationCostApplied,
      });
      customizationsForResponse.push({
        ingredientId: cust.ingredientId,
        customizationCostApplied: customizationCostApplied,
      });
    }
  }

  const orderItemId = generateOrderItemId();
  const totalCustomizeCostForItem =
    currentItemCustomizeCostPerUnit * item.quantity;
  const itemTotalPrice =
    (itemBasePrice + currentItemCustomizeCostPerUnit) * item.quantity;

  // Insert order item into database
  await connection.execute(
    "INSERT INTO OrderItem (OrderItemID, OrderID, MenuID, Quantity, Note, ItemBasePrice, CustomizeCost, ItemTotalPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      orderItemId,
      orderId,
      item.menuId,
      item.quantity,
      item.note || null,
      itemBasePrice,
      totalCustomizeCostForItem,
      itemTotalPrice,
    ]
  );

  // Insert custom ingredients into database
  for (const custDb of customizationsForDb) {
    await connection.execute(
      "INSERT INTO CustomIngredient (OrderItemID, IngredientID, Quantity, CustomizationCost) VALUES (?, ?, ?, ?)",
      [
        orderItemId,
        custDb.ingredientId,
        custDb.quantity,
        custDb.customizationCost,
      ]
    );
  }

  return {
    orderItem: {
      orderItemId: orderItemId,
      menuId: item.menuId,
      quantity: item.quantity,
      note: item.note || null,
      itemBasePrice: itemBasePrice,
      customizeCost: totalCustomizeCostForItem,
      itemTotalPrice: itemTotalPrice,
      customizations: customizationsForResponse,
    },
    itemTotalPrice: itemTotalPrice,
  };
}

module.exports = async (req, res) => {
  const { orderMakerEmpId, orderByCitizenId, items } = req.body;

  // Validate required fields
  if (
    !orderMakerEmpId ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Missing required fields: orderMakerEmpId and items array.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const orderId = generateOrderId();
    const orderDateTime = new Date();
    let calculatedOrderPrice = 0;
    const orderItemsResults = [];

    // Insert order into database
    await connection.execute(
      "INSERT INTO `Order` (OrderID, OrderDateTime, OrderStatus, OrderPrice, EmpID, CitizenID) VALUES (?, ?, ?, ?, ?, ?)",
      [
        orderId,
        orderDateTime,
        false,
        calculatedOrderPrice,
        orderMakerEmpId,
        orderByCitizenId || null,
      ]
    );

    // Process each item in the order
    for (const item of items) {
      const itemResult = await processOrderItem(item, orderId, connection);
      if (itemResult.error) {
        await connection.rollback();
        return res.status(400).json({ message: itemResult.error });
      }
      calculatedOrderPrice += itemResult.itemTotalPrice;
      orderItemsResults.push(itemResult.orderItem);
    }

    // Update order price after processing all items
    await connection.execute(
      'UPDATE `Order` SET OrderPrice = ? WHERE OrderID = ?',
      [calculatedOrderPrice, orderId],
    );
    

    await connection.commit();
    res.status(201).json({
      orderId: orderId,
      orderDateTime: orderDateTime.toISOString(),
      orderStatus: false,
      orderPrice: calculatedOrderPrice,
      orderMakerEmpId: orderMakerEmpId,
      orderByCitizenId: orderByCitizenId || null,
      orderItems: orderItemsResults,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating order:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while creating the order.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
