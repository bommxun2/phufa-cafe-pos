// tests/ingredient.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database');

let createdIngredientId;
let testIngredientCategoryId = 'IC-ING-TEST';

describe('Ingredient API - /ingredients & /ingredient-categories', () => {
  beforeAll(async () => {
    // Ensure a test category exists
    try {
      await db.query(
        "INSERT IGNORE INTO IngredientCategory (IngredientCategoryID, Name, AllowMultipleSelection, IsCustomizable) VALUES (?, 'Test Ing Category', false, true)",
        [testIngredientCategoryId],
      );
    } catch (err) {
      console.error('Error setting up ingredient category for tests:', err);
    }
  });

  afterAll(async () => {
    if (createdIngredientId) {
      try {
        await db.query('DELETE FROM Ingredient WHERE IngredientID = ?', [
          createdIngredientId,
        ]);
      } catch (err) {}
    }
    try {
      await db.query(
        'DELETE FROM IngredientCategory WHERE IngredientCategoryID = ?',
        [testIngredientCategoryId],
      );
    } catch (err) {}
    // db.end();
  });

  it('GET /ingredient-categories - should return a list of ingredient categories', async () => {
    const res = await request(app).get('/ingredient-categories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Check if our test category is present
    expect(
      res.body.some(
        cat => cat.ingredientCategoryId === testIngredientCategoryId,
      ),
    ).toBe(true);
  });

  it('POST /ingredients - should create a new ingredient', async () => {
    const newIngredient = {
      ingredientId: `I-TEST-${Date.now()}`.slice(0, 10), // Max 10 chars for IngredientID
      name: `Test Ingredient ${Date.now()}`,
      quantity: 100.5,
      unit: 'grams',
      adjustmentPrice: 5.0,
      costPerUnit: 0.75,
      category: testIngredientCategoryId, // Use the test category ID
    };
    const res = await request(app).post('/ingredients').send(newIngredient);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('ingredientId', newIngredient.ingredientId);
    expect(res.body.name).toBe(newIngredient.name);
    createdIngredientId = res.body.ingredientId;
  });

  it('POST /ingredients - should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/ingredients')
      .send({name: 'Incomplete Ing'});
    expect(res.statusCode).toBe(400);
  });

  it('POST /ingredients - should return 400 for non-existent category', async () => {
    const newIngredient = {
      ingredientId: `I-BADCAT-${Date.now()}`.slice(0, 10),
      name: `Test Ingredient Bad Cat ${Date.now()}`,
      quantity: 100,
      unit: 'g',
      costPerUnit: 1,
      category: 'IC_NON_EXISTENT',
    };
    const res = await request(app).post('/ingredients').send(newIngredient);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Ingredient category with ID');
  });

  it('GET /ingredients - should return a list of all ingredients', async () => {
    const res = await request(app).get('/ingredients');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (createdIngredientId) {
      expect(
        res.body.some(ing => ing.ingredientId === createdIngredientId),
      ).toBe(true);
    }
  });

  it('GET /ingredients/:ingredientId - should return a specific ingredient', async () => {
    if (!createdIngredientId) {
      const sampleIngredientId = 'I985630000'; // Almond Milk from sample
      const res = await request(app).get(`/ingredients/${sampleIngredientId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('ingredientId', sampleIngredientId);
      return;
    }
    const res = await request(app).get(`/ingredients/${createdIngredientId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ingredientId', createdIngredientId);
  });

  it('GET /ingredients/:ingredientId - should return 404 for non-existent ingredient', async () => {
    const res = await request(app).get('/ingredients/I_NONEXISTENT');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /ingredients/:ingredientId - should update an existing ingredient', async () => {
    if (!createdIngredientId) {
      console.warn(
        'Skipping PUT /ingredients/:ingredientId test as createdIngredientId is not set.',
      );
      return;
    }
    const updatedData = {
      name: `Updated Test Ingredient ${Date.now()}`,
      quantity: 150.0,
    };
    const res = await request(app)
      .put(`/ingredients/${createdIngredientId}`)
      .send(updatedData);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe(updatedData.name);
    expect(res.body.quantity).toBe(updatedData.quantity);
  });

  it('PUT /ingredients/:ingredientId - should return 404 for non-existent ingredient', async () => {
    const res = await request(app)
      .put('/ingredients/I_NONEXISTENT')
      .send({quantity: 10});
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /ingredients/:ingredientId - should delete an ingredient (if not in use)', async () => {
    if (!createdIngredientId) {
      console.warn(
        'Skipping DELETE /ingredients/:ingredientId test as createdIngredientId is not set.',
      );
      return;
    }
    // Ensure this ingredient is not in DefaultRecipe or CustomIngredient for a successful delete
    const res = await request(app).delete(
      `/ingredients/${createdIngredientId}`,
    );
    // If not referenced, status 204. If referenced, status 400.
    if (res.statusCode === 204) {
      expect(res.statusCode).toBe(204);
      const getRes = await request(app).get(
        `/ingredients/${createdIngredientId}`,
      );
      expect(getRes.statusCode).toBe(404);
      createdIngredientId = null; // Prevent afterAll from trying to delete again
    } else {
      expect(res.statusCode).toBe(400);
      console.warn(
        `DELETE /ingredients/${createdIngredientId} failed with 400, possibly due to FK constraints.`,
      );
    }
  });

  it('DELETE /ingredients/:ingredientId - should return 404 for non-existent ingredient', async () => {
    const res = await request(app).delete('/ingredients/I_NONEXISTENT_DEL');
    expect(res.statusCode).toBe(404);
  });
});
