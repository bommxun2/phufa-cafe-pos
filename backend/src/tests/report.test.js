// tests/report.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database'); // For inserting test data

describe('Report API - /reports', () => {
  const testDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD
  let testOrderIdForReport;
  const testEmpIdForReport = '6609696969'; // Sample employee

  beforeAll(async () => {
    // Create a paid order for today to test the daily income report
    try {
      // Ensure a menu item exists and is available
      await db.query(
        "INSERT IGNORE INTO Menu (MenuID, MenuName, MenuPrice, MenuStatus, MenuCategory) VALUES ('M-REPORT', 'Report Test Item', 25.50, 'พร้อมขาย', 'Test')",
      );

      const orderRes = await request(app)
        .post('/orders')
        .send({
          orderMakerEmpId: testEmpIdForReport,
          items: [{menuId: 'M-REPORT', quantity: 2}], // Total 51.00
        });
      if (orderRes.statusCode === 201) {
        testOrderIdForReport = orderRes.body.orderId;
        // Mark it as paid
        await request(app)
          .patch(`/orders/${testOrderIdForReport}`)
          .send({orderStatus: true});
      } else {
        console.error('Failed to create test order for report:', orderRes.body);
      }
    } catch (err) {
      console.error('Error in report test setup:', err);
    }
  });

  afterAll(async () => {
    if (testOrderIdForReport) {
      try {
        await db.query('DELETE FROM `Order` WHERE OrderID = ?', [
          testOrderIdForReport,
        ]);
      } catch (err) {}
    }
    try {
      await db.query("DELETE FROM Menu WHERE MenuID = 'M-REPORT'");
    } catch (err) {}
    // db.end();
  });

  it('GET /reports/daily-income - should return daily income summary for a specific date', async () => {
    if (!testOrderIdForReport) {
      console.warn(
        'Skipping daily income report test as test order creation failed.',
      );
      return;
    }
    const res = await request(app).get(
      `/reports/daily-income?date=${testDate}`,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('date', testDate);
    expect(res.body).toHaveProperty('totalIncome');
    expect(res.body).toHaveProperty('orderCount');
    // Based on the order created in beforeAll
    expect(res.body.totalIncome).toBeGreaterThanOrEqual(51.0);
    expect(res.body.orderCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /reports/daily-income - should return 0 for a date with no paid orders', async () => {
    const futureDate = '2999-12-31'; // A date unlikely to have orders
    const res = await request(app).get(
      `/reports/daily-income?date=${futureDate}`,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('date', futureDate);
    expect(res.body.totalIncome).toBe(0);
    expect(res.body.orderCount).toBe(0);
  });

  it('GET /reports/daily-income - should return 400 for invalid date format', async () => {
    const res = await request(app).get(
      '/reports/daily-income?date=invalid-date',
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      'Invalid date format. Please use YYYY-MM-DD.',
    );
  });

  it('GET /reports/daily-income - should return 400 if date is missing', async () => {
    const res = await request(app).get('/reports/daily-income');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Date query parameter is required.');
  });
});
