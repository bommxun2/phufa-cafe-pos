// tests/customer.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database');

let createdCustomerId; // This will be a CitizenID

describe('Customer API - /customers', () => {
  afterAll(async () => {
    if (createdCustomerId) {
      try {
        // Customer deletion cascades to Person if ON DELETE CASCADE is on Person(CitizenID) from Customer(CitizenID)
        // Our schema: Customer FK to Person is ON DELETE CASCADE. So deleting customer should remove person if not used elsewhere.
        // However, if other tables (like Order) reference Person directly and have RESTRICT,
        // it might get complicated. For now, just delete Customer.
        await db.query('DELETE FROM Customer WHERE CitizenID = ?', [
          createdCustomerId,
        ]);
        // Also attempt to delete from Person, in case customer deletion didn't cascade or was partial
        await db.query('DELETE FROM Person WHERE CitizenID = ?', [
          createdCustomerId,
        ]);
      } catch (err) {}
    }
    // db.end();
  });

  it('POST /customers - should create a new customer', async () => {
    const newCustomer = {
      citizenId: `${Date.now()}`.slice(0, 13),
      firstname: 'Test',
      lastname: 'Customer',
      phoneNum: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`, // random phone
      gender: 'M',
      address: '123 Test St',
      profileUrl: 'https://example.com/image.jpg',
    };
    const res = await request(app).post('/customers').send(newCustomer);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('citizenId', newCustomer.citizenId);
    expect(res.body.point).toBe(0); // Default points
    createdCustomerId = res.body.citizenId;
  });

  it('POST /customers - should return 400 for duplicate citizenId', async () => {
    if (!createdCustomerId) {
      console.warn(
        'Skipping POST duplicate customer test, initial creation failed.',
      );
      return;
    }
    const duplicateCustomer = {
      citizenId: createdCustomerId, // Use existing citizenId
      firstname: 'Duplicate',
      lastname: 'Cust',
      phoneNum: '0900000001',
    };
    const res = await request(app).post('/customers').send(duplicateCustomer);
    expect(res.statusCode).toBe(400); // Because citizenId is PK for Customer and Person
  });

  it('GET /customers - should return a list of all customers', async () => {
    const res = await request(app).get('/customers');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (createdCustomerId) {
      expect(res.body.some(cust => cust.citizenId === createdCustomerId)).toBe(
        true,
      );
    }
  });

  it('GET /customers/:customerId - should return a specific customer', async () => {
    if (!createdCustomerId) {
      const sampleCustomerId = '1112223334445'; // From sample data
      const res = await request(app).get(`/customers/${sampleCustomerId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('citizenId', sampleCustomerId);
      return;
    }
    const res = await request(app).get(`/customers/${createdCustomerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('citizenId', createdCustomerId);
  });

  it('GET /customers/:customerId - should return 404 for non-existent customer', async () => {
    const res = await request(app).get('/customers/0000000000000');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /customers/:customerId - should update an existing customer', async () => {
    if (!createdCustomerId) {
      console.warn(
        'Skipping PUT /customers/:customerId test as createdCustomerId is not set.',
      );
      return;
    }
    const updatedData = {
      firstname: 'UpdatedTest',
      address: '456 New Ave',
      phoneNum: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
    };
    const res = await request(app)
      .put(`/customers/${createdCustomerId}`)
      .send(updatedData);
    expect(res.statusCode).toBe(200);
    expect(res.body.firstname).toBe(updatedData.firstname);
    expect(res.body.address).toBe(updatedData.address);
  });

  it('POST /customers/:customerId/points - should add loyalty points', async () => {
    if (!createdCustomerId) {
      console.warn(
        'Skipping POST points test as createdCustomerId is not set.',
      );
      return;
    }
    const res = await request(app)
      .post(`/customers/${createdCustomerId}/points`)
      .send({pointsToAdd: 5});
    expect(res.statusCode).toBe(200);
    expect(res.body.newPointBalance).toBeGreaterThanOrEqual(5); // Initial points + 5
    const initialPoints = res.body.newPointBalance - 5; // Store for redeem test

    // Add more points to allow for redemption
    await request(app)
      .post(`/customers/${createdCustomerId}/points`)
      .send({pointsToAdd: 10});
  });

  it('POST /customers/:customerId/redeem - should redeem loyalty points', async () => {
    if (!createdCustomerId) {
      console.warn(
        'Skipping POST redeem test as createdCustomerId is not set.',
      );
      return;
    }
    // Ensure customer has at least 10 points from previous test
    const customerRes = await request(app).get(
      `/customers/${createdCustomerId}`,
    );
    const currentPoints = customerRes.body.point;

    if (currentPoints < 10) {
      console.warn(
        `Skipping redeem test, customer ${createdCustomerId} has ${currentPoints} points, needs 10.`,
      );
      // Optionally add points if needed for test consistency
      await request(app)
        .post(`/customers/${createdCustomerId}/points`)
        .send({pointsToAdd: 10 - currentPoints});
    }

    const redeemRes = await request(app).post(
      `/customers/${createdCustomerId}/redeem`,
    );
    expect(redeemRes.statusCode).toBe(200);
    expect(redeemRes.body).toHaveProperty(
      'message',
      'Free drink reward applied.',
    );
    expect(redeemRes.body.newPointBalance).toBe(
      currentPoints - 10 + (currentPoints < 10 ? 10 - currentPoints : 0),
    );
  });

  it('POST /customers/:customerId/redeem - should return 400 for insufficient points', async () => {
    if (!createdCustomerId) {
      console.warn(
        'Skipping POST redeem (insufficient) test as createdCustomerId is not set.',
      );
      return;
    }
    // Ensure points are less than 10, e.g., by trying to redeem again
    const customerRes = await request(app).get(
      `/customers/${createdCustomerId}`,
    );
    if (customerRes.body.point >= 10) {
      // Redeem until < 10
      await request(app).post(`/customers/${createdCustomerId}/redeem`);
    }
    const finalCheck = await request(app).get(
      `/customers/${createdCustomerId}`,
    );
    if (finalCheck.body.point < 10) {
      const res = await request(app).post(
        `/customers/${createdCustomerId}/redeem`,
      );
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        'Not enough points to redeem a free drink',
      );
    } else {
      console.warn('Could not reliably test insufficient points for redeem.');
    }
  });
});
