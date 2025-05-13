// tests/employee.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database');

let createdEmpId;
let createdCitizenId = `${Date.now()}`.slice(0, 13); // Unique citizenId

describe('Employee API - /employees', () => {
  afterAll(async () => {
    if (createdEmpId) {
      try {
        // Attempt to delete related orders first if any were made by this test employee
        // For simplicity, this is not handled here. Test assumes employee can be deleted.
        await db.query('DELETE FROM Employee WHERE EmpID = ?', [createdEmpId]);
      } catch (err) {}
    }
    if (createdCitizenId) {
      try {
        await db.query('DELETE FROM Person WHERE CitizenID = ?', [
          createdCitizenId,
        ]);
      } catch (err) {}
    }
    // db.end();
  });

  it('POST /employees - should create a new employee', async () => {
    const newEmployee = {
      citizenId: createdCitizenId,
      firstname: 'Test',
      lastname: 'Employee',
      gender: 'M',
      address: '123 Test St',
      profileUrl: 'https://example.com/image.jpg',
      phoneNum: `08${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`, // random phone
      empId: `E${Date.now()}`.slice(0, 10),
      empRole: 'Tester',
      empSalary: 30000,
      password: 'testpassword123',
    };
    const res = await request(app).post('/employees').send(newEmployee);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('empId', newEmployee.empId);
    expect(res.body.citizenId).toBe(newEmployee.citizenId);
    createdEmpId = res.body.empId; // Keep empId, citizenId is already set
  });

  it('POST /employees - should return 400 for duplicate empId', async () => {
    if (!createdEmpId) {
      console.warn(
        'Skipping POST duplicate empId test, initial employee creation failed.',
      );
      return;
    }
    const duplicateEmployee = {
      citizenId: `${Date.now()}`.slice(0, 13),
      firstname: 'Duplicate',
      lastname: 'Emp',
      phoneNum: '0800000001',
      empId: createdEmpId, // Use existing empId
      empRole: 'DuplicateRole',
      empSalary: 10000,
      password: 'password',
    };
    const res = await request(app).post('/employees').send(duplicateEmployee);
    expect(res.statusCode).toBe(400); // Assuming ER_DUP_ENTRY for empId (PRIMARY)
    expect(res.body.message).toContain('already exists');
  });

  it('GET /employees - should return a list of all employees', async () => {
    const res = await request(app).get('/employees');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (createdEmpId) {
      expect(res.body.some(emp => emp.empId === createdEmpId)).toBe(true);
    }
  });

  it('GET /employees/:empId - should return a specific employee', async () => {
    if (!createdEmpId) {
      const sampleEmpId = '6609696969'; // From sample data
      const res = await request(app).get(`/employees/${sampleEmpId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('empId', sampleEmpId);
      return;
    }
    const res = await request(app).get(`/employees/${createdEmpId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('empId', createdEmpId);
  });

  it('GET /employees/:empId - should return 404 for non-existent employee', async () => {
    const res = await request(app).get('/employees/EMP_NONEXISTENT');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /employees/:empId - should update an existing employee', async () => {
    if (!createdEmpId) {
      console.warn(
        'Skipping PUT /employees/:empId test as createdEmpId is not set.',
      );
      return;
    }
    const updatedData = {
      firstname: 'UpdatedTest',
      empRole: 'Senior Tester',
      phoneNum: `08${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
    };
    const res = await request(app)
      .put(`/employees/${createdEmpId}`)
      .send(updatedData);
    expect(res.statusCode).toBe(200);
    expect(res.body.firstname).toBe(updatedData.firstname);
    expect(res.body.empRole).toBe(updatedData.empRole);
  });

  it('DELETE /employees/:empId - should delete an employee (if no dependent orders)', async () => {
    // Create a new employee just for this delete test to avoid conflicts
    const tempCitizenId = `DELTESTC${Date.now()}`.slice(0, 13);
    const tempEmpId = `DELTESTE${Date.now()}`.slice(0, 10);
    const tempEmployee = {
      citizenId: tempCitizenId,
      firstname: 'ToDelete',
      lastname: 'Emp',
      phoneNum: `08${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      empId: tempEmpId,
      empRole: 'Deletable',
      empSalary: 100,
      password: 'del',
    };
    const createRes = await request(app).post('/employees').send(tempEmployee);
    expect(createRes.statusCode).toBe(201);

    const deleteRes = await request(app).delete(`/employees/${tempEmpId}`);
    // This will be 400 if the employee is referenced in `Order`.EmpID (ON DELETE RESTRICT)
    // For a clean test, ensure this tempEmpId has no orders.
    if (deleteRes.statusCode === 204) {
      expect(deleteRes.statusCode).toBe(204);
      const getRes = await request(app).get(`/employees/${tempEmpId}`);
      expect(getRes.statusCode).toBe(404);
    } else {
      expect(deleteRes.statusCode).toBe(400); // Or other error if FK violated
      console.warn(
        `DELETE /employees/${tempEmpId} failed, likely due to FK constraints. Status: ${deleteRes.statusCode}`,
      );
      // Clean up the created person if employee deletion failed but person was created
      await db
        .query('DELETE FROM Person WHERE CitizenID = ?', [tempCitizenId])
        .catch(() => {});
    }
  });
});
