const db = require('../../utils/database');

/**
 * @desc    Cancel/Delete an unpaid order
 * @route   DELETE /api/orders/:orderId
 * @access  Private (Requires specific privileges, e.g., Admin or Employee who created it, or if unpaid)
 */
module.exports =  async (req, res) => {
  const { orderId } = req.params;

  // 1. ตรวจสอบว่า Order ID ที่ต้องการลบมีอยู่ในระบบหรือไม่ และสถานะเป็นอย่างไร
  const orders = await db.query('SELECT OrderID, OrderStatus FROM `Order` WHERE OrderID = ?', [orderId]);

  if (orders.length === 0) {
    console.error(`Order with ID '${orderId}' not found.`);
    return res.status(404).json({"message": `Order with ID '${orderId}' not found.`});
  }

  const orderToDelete = orders[0];

  // 2. ตรวจสอบตาม API Spec: "Cancels or deletes an unpaid order. Paid orders usually cannot be deleted"
  // OrderStatus: false (0) = pending payment, true (1) = paid
  if (orderToDelete.OrderStatus === 1 || orderToDelete.OrderStatus === true) {
    console.error(`Cannot delete order '${orderId}' because it has already been paid.`);
    return res.status(400).json({"message": `Cannot delete order '${orderId}' because it has already been paid.`});
  }

  // 3. ทำการลบ Order (เนื่องจากมี ON DELETE CASCADE ในตาราง OrderItem, รายการใน OrderItem จะถูกลบไปด้วย)
  // และ CustomIngredient ก็จะถูกลบไปด้วยเพราะ OrderItem ถูกลบ
  const deleteResult = await db.query('DELETE FROM `Order` WHERE OrderID = ?', [orderId]);

  if (deleteResult.affectedRows === 0) {
    // สถานการณ์นี้ไม่ควรเกิดขึ้นถ้าการตรวจสอบด้านบนถูกต้อง
    // แต่อาจจะเกิดขึ้นได้ในกรณี race condition หากมี process อื่นลบไปก่อน
    console.error(`Order with ID '${orderId}' could not be deleted or was already deleted.`);
    return res.status(500).json({message: `Order with ID '${orderId}' could not be deleted or was already deleted.`}); // หรืออาจจะเป็น 500 ถ้าบ่งบอกถึง state ที่ไม่คาดคิด
  }

  // 4. ตอบกลับด้วย 204 No Content ตาม API Spec
  res.status(204).send();
};