// tests/order.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database');

let createdOrderId;
let testEmployeeId = '6609696969'; // From sample data, ensure this employee exists
let testCustomerId = '1112223334445'; // From sample data, ensure this customer exists
let testMenuId = 'M213560000'; // Latte from sample data, ensure it's 'พร้อมขาย'
let testIngredientForCustomization = 'I985630000'; // Almond milk from sample, ensure it exists

describe('Order API - /orders', () => {
  beforeAll(async () => {
    // Ensure prerequisite data exists (employee, customer, menu, ingredient)
    // This is crucial for order creation tests.
    // For simplicity, we assume sample data is loaded.
    // A robust setup would insert this data if it's missing.
    try {
      const menu = await db.query(
        'SELECT MenuStatus FROM Menu WHERE MenuID = ?',
        [testMenuId],
      );
      if (menu.length === 0 || menu[0].MenuStatus !== 'พร้อมขาย') {
        console.warn(
          `Test menu ${testMenuId} is not 'พร้อมขาย' or does not exist. Order creation might fail.`,
        );
        // Optionally, update it to 'พร้อมขาย' for the test
        // await db.query("UPDATE Menu SET MenuStatus = 'พร้อมขาย' WHERE MenuID = ?", [testMenuId]);
      }
    } catch (err) {
      console.error('Pre-test check for order failed:', err);
    }
  });

  afterAll(async () => {
    if (createdOrderId) {
      try {
        // Must delete from CustomIngredient and OrderItem first if not using CASCADE on Order delete
        // The current OrderItem schema has ON DELETE CASCADE for OrderID.
        // The current CustomIngredient schema has ON DELETE CASCADE for OrderItemID.
        // So deleting from Order should cascade.
        await db.query('DELETE FROM `Order` WHERE OrderID = ?', [
          createdOrderId,
        ]);
      } catch (err) {
        // console.error("Error cleaning up created order:", err);
      }
    }
    // db.end();
  });

  it('POST /orders - should create a new order', async () => {
    const newOrder = {
      orderMakerEmpId: testEmployeeId,
      orderByCitizenId: testCustomerId,
      items: [
        {
          menuId: testMenuId, // Latte
          quantity: 1,
          note: 'Extra hot',
          customizations: [
            {ingredientId: testIngredientForCustomization}, // Almond Milk
          ],
        },
        {
          menuId: 'M213560002', // Matcha Latte from sample, ensure 'พร้อมขาย'
          quantity: 1,
        },
      ],
    };
    const res = await request(app).post('/orders').send(newOrder);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body.orderMakerEmpId).toBe(testEmployeeId);
    expect(res.body.orderByCitizenId).toBe(testCustomerId);
    expect(res.body.orderItems.length).toBe(2);
    expect(res.body.orderItems[0].customizations.length).toBe(1);
    createdOrderId = res.body.orderId;
  });

  it('POST /orders - should return 400 for invalid item data (e.g., non-existent menu)', async () => {
    const newOrder = {
      orderMakerEmpId: testEmployeeId,
      items: [{menuId: 'M_NONEXISTENT', quantity: 1}],
    };
    const res = await request(app).post('/orders').send(newOrder);
    expect(res.statusCode).toBe(400);
  });

  it('GET /orders - should return a list of all orders (requires admin/owner in real scenario)', async () => {
    const res = await request(app).get('/orders');
    expect(res.statusCode).toBe(200); // Will pass if controller doesn't enforce auth yet
    expect(Array.isArray(res.body)).toBe(true);
    if (createdOrderId) {
      expect(res.body.some(order => order.orderId === createdOrderId)).toBe(
        true,
      );
    }
  });

  it('GET /orders - should filter orders by status', async () => {
    // Create a paid order for testing filter (or ensure one exists)
    // For now, assume a paid order exists with status true (1)
    const res = await request(app).get('/orders?status=true');
    expect(res.statusCode).toBe(200);
    res.body.forEach(order => expect(order.orderStatus).toBe(true));
  });

  it('GET /orders/:orderId - should return a specific order', async () => {
    if (!createdOrderId) {
      const sampleOrderId = 'O265980001'; // Paid order from sample data
      const res = await request(app).get(`/orders/${sampleOrderId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('orderId', sampleOrderId);
      return;
    }
    const res = await request(app).get(`/orders/${createdOrderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('orderId', createdOrderId);
    expect(res.body.orderItems.length).toBeGreaterThan(0);
  });

  it('GET /orders/:orderId - should return 404 for non-existent order', async () => {
    const res = await request(app).get('/orders/O_NONEXISTENT');
    expect(res.statusCode).toBe(404);
  });

  it('PATCH /orders/:orderId - should update order status to paid', async () => {
    if (!createdOrderId) {
      console.warn(
        'Skipping PATCH /orders/:orderId test as createdOrderId is not set.',
      );
      return;
    }
    const res = await request(app)
      .patch(`/orders/${createdOrderId}`)
      .send({orderStatus: true}); // Mark as paid
    expect(res.statusCode).toBe(200);
    expect(res.body.orderStatus).toBe(true);
  });

  it('PATCH /orders/:orderId - should return 400 for invalid status value', async () => {
    if (!createdOrderId) {
      console.warn(
        'Skipping PATCH /orders/:orderId (invalid) test as createdOrderId is not set.',
      );
      return;
    }
    const res = await request(app)
      .patch(`/orders/${createdOrderId}`)
      .send({orderStatus: 'not_a_boolean'});
    expect(res.statusCode).toBe(400);
  });

  // Test for deleting an UNPAID order
  it('DELETE /orders/:orderId - should delete an unpaid order', async () => {
    // Create a new temporary order that will be unpaid
    const tempOrderData = {
      orderMakerEmpId: testEmployeeId,
      items: [{menuId: testMenuId, quantity: 1}],
    };
    const createRes = await request(app).post('/orders').send(tempOrderData);
    expect(createRes.statusCode).toBe(201);
    const tempOrderId = createRes.body.orderId;

    const deleteRes = await request(app).delete(`/orders/${tempOrderId}`);
    expect(deleteRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/orders/${tempOrderId}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('DELETE /orders/:orderId - should return 400 if trying to delete a paid order', async () => {
    if (!createdOrderId) {
      console.warn(
        'Skipping DELETE /orders/:orderId (paid) test as createdOrderId is not set.',
      );
      return;
    }
    // Ensure createdOrderId is marked as paid from previous test
    const paidOrderRes = await request(app).get(`/orders/${createdOrderId}`);
    if (paidOrderRes.body.orderStatus !== true) {
      await request(app)
        .patch(`/orders/${createdOrderId}`)
        .send({orderStatus: true});
    }

    const res = await request(app).delete(`/orders/${createdOrderId}`);
    expect(res.statusCode).toBe(400); // Because it's paid
  });

  it('GET /employees/:empId/orders - should return orders for a specific employee', async () => {
    const res = await request(app).get(`/employees/${testEmployeeId}/orders`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // If an order was created by this employee, it should be in the list
    if (createdOrderId) {
      const orderForEmp = await db.query(
        'SELECT OrderID FROM `Order` WHERE OrderID = ? AND EmpID = ?',
        [createdOrderId, testEmployeeId],
      );
      if (orderForEmp.length > 0) {
        expect(res.body.some(order => order.orderId === createdOrderId)).toBe(
          true,
        );
      }
    }
    res.body.forEach(order =>
      expect(order.orderMakerEmpId).toBe(testEmployeeId),
    );
  });

  it('GET /employees/:empId/orders - should return 404 if employee does not exist', async () => {
    const res = await request(app).get('/employees/EMP_NONEXISTENT/orders');
    expect(res.statusCode).toBe(404);
  });
});
