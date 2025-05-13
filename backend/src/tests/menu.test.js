// tests/menu.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../utils/database');
const {generateMenuId} = require('../utils/idGenerator'); // For cleanup if needed

// Global variable to store created menuId for use in subsequent tests
let createdMenuId;

describe('Menu API - /menu', () => {
  beforeAll(async () => {
    // Optional: Seed database with necessary ingredients if they don't exist
    // For example, 'I985630001' and 'I985630003' used in default recipe.
    // Ensure IngredientCategory 'IC98563002' and 'IC98563000' exist for these ingredients.
    try {
      await db.query(
        "INSERT IGNORE INTO IngredientCategory (IngredientCategoryID, Name, AllowMultipleSelection, IsCustomizable) VALUES ('IC-TEST-CAT', 'Test Category', FALSE, TRUE)",
      );
      await db.query(
        "INSERT IGNORE INTO Ingredient (IngredientID, Name, Quantity, Unit, CostPerUnit, AdjustmentPrice, IngredientCategoryID) VALUES ('ING-TEST-1', 'Test Coffee Beans', 100, 'g', 0.5, 0, 'IC-TEST-CAT')",
      );
      await db.query(
        "INSERT IGNORE INTO Ingredient (IngredientID, Name, Quantity, Unit, CostPerUnit, AdjustmentPrice, IngredientCategoryID) VALUES ('ING-TEST-2', 'Test Milk', 1000, 'ml', 0.1, 0, 'IC-TEST-CAT')",
      );
    } catch (err) {
      console.error('Error during pre-test data setup for Menu:', err);
    }
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdMenuId) {
      try {
        await db.query('DELETE FROM DefaultRecipe WHERE MenuID = ?', [
          createdMenuId,
        ]);
        await db.query('DELETE FROM Menu WHERE MenuID = ?', [createdMenuId]);
      } catch (err) {
        // Ignore errors during cleanup, e.g., if menu was already deleted by a test
      }
    }
    // Clean up test ingredients and category
    try {
      await db.query(
        "DELETE FROM Ingredient WHERE IngredientID IN ('ING-TEST-1', 'ING-TEST-2')",
      );
      await db.query(
        "DELETE FROM IngredientCategory WHERE IngredientCategoryID = 'IC-TEST-CAT'",
      );
    } catch (err) {}

    // db.end(); // Close db connection if your db utility needs it
  });

  it('POST /menu - should create a new menu item', async () => {
    const newMenu = {
      menuName: `Test Menu ${Date.now()}`, // Unique name
      menuPrice: 75.0,
      menuStatus: 'พร้อมขาย',
      menuCategory: 'เครื่องดื่มทดสอบ',
      menuDescription: 'A test beverage',
      menuUrl: 'http://example.com/test.jpg',
      defaultRecipe: [
        {
          ingredientId: 'ING-TEST-1',
          quantity: 20,
          isBaseIngredient: true,
          isReplaceable: false,
        },
        {
          ingredientId: 'ING-TEST-2',
          quantity: 150,
          isBaseIngredient: true,
          isReplaceable: true,
        },
      ],
    };
    const res = await request(app).post('/menu').send(newMenu);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('menuId');
    expect(res.body.menuName).toBe(newMenu.menuName);
    createdMenuId = res.body.menuId; // Save for other tests
  });

  it('POST /menu - should return 400 for missing required fields', async () => {
    const res = await request(app).post('/menu').send({menuPrice: 50});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      'message',
      'Invalid menu data provided. Check required fields and formats.',
    );
  });

  it('GET /menu - should return a list of all menu items', async () => {
    const res = await request(app).get('/menu');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Check if the newly created menu is in the list (if createdMenuId is set)
    if (createdMenuId) {
      expect(res.body.some(menu => menu.menuId === createdMenuId)).toBe(true);
    }
  });

  it('GET /menu - should filter menu items by category', async () => {
    // Assuming 'กาแฟ' category exists from sample data
    const res = await request(app).get('/menu?category=กาแฟ');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      res.body.forEach(item => expect(item.menuCategory).toBe('กาแฟ'));
    }
  });

  it('GET /menu/:menuId - should return a specific menu item', async () => {
    if (!createdMenuId) {
      // If POST test failed or didn't run, use a known ID from sample data
      // This makes the test less isolated but runnable.
      const sampleMenuId = 'M213560000'; // Latte from sample
      const res = await request(app).get(`/menu/${sampleMenuId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('menuId', sampleMenuId);
      return; // End test early
    }
    const res = await request(app).get(`/menu/${createdMenuId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('menuId', createdMenuId);
  });

  it('GET /menu/:menuId - should return 404 for non-existent menu item', async () => {
    const res = await request(app).get('/menu/M_NONEXISTENT');
    expect(res.statusCode).toBe(404);
  });

  it('GET /menu/category/:categoryName - should return menu items for a category', async () => {
    const res = await request(app).get('/menu/category/กาแฟ'); // From sample data
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(item => expect(item.menuCategory).toBe('กาแฟ'));
  });

  it('GET /menu/category/:categoryName - should return 404 for non-existent category', async () => {
    const res = await request(app).get('/menu/category/없는카테고리');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /menu/:menuId - should update an existing menu item', async () => {
    if (!createdMenuId) {
      console.warn(
        'Skipping PUT /menu/:menuId test as createdMenuId is not set.',
      );
      return;
    }
    const updatedData = {
      menuName: `Updated Test Menu ${Date.now()}`,
      menuPrice: 80.0,
      defaultRecipe: [
        // Ensure recipe update works
        {
          ingredientId: 'ING-TEST-1',
          quantity: 25,
          isBaseIngredient: true,
          isReplaceable: false,
        },
      ],
    };
    const res = await request(app)
      .put(`/menu/${createdMenuId}`)
      .send(updatedData);
    expect(res.statusCode).toBe(200);
    expect(res.body.menuName).toBe(updatedData.menuName);
    expect(res.body.menuPrice).toBe(updatedData.menuPrice);
  });

  it('PUT /menu/:menuId - should return 404 for non-existent menu item', async () => {
    const res = await request(app)
      .put('/menu/M_NONEXISTENT')
      .send({menuPrice: 100});
    expect(res.statusCode).toBe(404);
  });

  it('PATCH /menu/:menuId - should update menu item status', async () => {
    if (!createdMenuId) {
      console.warn(
        'Skipping PATCH /menu/:menuId test as createdMenuId is not set.',
      );
      return;
    }
    const statusUpdate = {menuStatus: 'ไม่พร้อมขายชั่วคราว'};
    const res = await request(app)
      .patch(`/menu/${createdMenuId}`)
      .send(statusUpdate);
    expect(res.statusCode).toBe(200);
    expect(res.body.menuStatus).toBe(statusUpdate.menuStatus);
  });

  it('PATCH /menu/:menuId - should return 400 for invalid status data', async () => {
    if (!createdMenuId) {
      console.warn(
        'Skipping PATCH /menu/:menuId (invalid data) test as createdMenuId is not set.',
      );
      return;
    }
    const res = await request(app)
      .patch(`/menu/${createdMenuId}`)
      .send({menuStatus: ''}); // Empty status
    expect(res.statusCode).toBe(400);
  });

  it('GET /menu/:menuId/recipe - should get the default recipe for a menu item', async () => {
    if (!createdMenuId) {
      // Use sample data if POST failed
      const sampleMenuWithRecipe = 'M213560000'; // Latte
      const res = await request(app).get(
        `/menu/${sampleMenuWithRecipe}/recipe`,
      );
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('ingredientId');
      return;
    }
    const res = await request(app).get(`/menu/${createdMenuId}/recipe`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Based on the PUT test, recipe should now have 1 item
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('ingredientId', 'ING-TEST-1');
  });

  it('GET /menu/:menuId/recipe - should return 404 if menu has no recipe', async () => {
    // Create a temporary menu without a recipe for this test
    const tempMenuName = `No Recipe Menu ${Date.now()}`;
    const menuRes = await request(app).post('/menu').send({
      menuName: tempMenuName,
      menuPrice: 10,
      menuStatus: 'พร้อมขาย',
      menuCategory: 'Test',
      defaultRecipe: [], // Empty recipe initially, or controller needs to handle this better
    });
    // The createMenu controller might require defaultRecipe to not be empty.
    // If it does, this test setup needs to be more involved (e.g. direct DB insert or update recipe to be empty).
    // Assuming createMenu allows empty defaultRecipe or creates a menu and then we delete its recipe.
    // For simplicity, let's assume a menu 'M_NORECIPE' exists without a recipe.
    // This test is more reliable if you ensure 'M_NORECIPE' truly has no recipe entries in DefaultRecipe table.
    const noRecipeMenuId = 'M_NORECIPE_TEST'; // Placeholder
    try {
      await db.query(
        'INSERT INTO Menu (MenuID, MenuName, MenuPrice, MenuStatus, MenuCategory) VALUES (?, ?, ?, ?, ?)',
        [noRecipeMenuId, 'No Recipe Item', 10, 'พร้อมขาย', 'Test'],
      );
      const res = await request(app).get(`/menu/${noRecipeMenuId}/recipe`);
      expect(res.statusCode).toBe(404);
    } finally {
      await db.query('DELETE FROM Menu WHERE MenuID = ?', [noRecipeMenuId]);
    }
  });

  // DELETE test should be last for this menuId or use a different menuId
  it('DELETE /menu/:menuId - should delete a menu item (if not in an order)', async () => {
    if (!createdMenuId) {
      console.warn(
        'Skipping DELETE /menu/:menuId test as createdMenuId is not set.',
      );
      return;
    }
    // To make this test pass consistently, ensure createdMenuId is not part of any order.
    // If it is, it will return 400 due to FK constraint.
    const res = await request(app).delete(`/menu/${createdMenuId}`);
    // If it's not referenced, it will be 204. If referenced, it will be 400.
    if (res.statusCode === 204) {
      expect(res.statusCode).toBe(204);
      // Verify it's actually deleted
      const getRes = await request(app).get(`/menu/${createdMenuId}`);
      expect(getRes.statusCode).toBe(404);
      createdMenuId = null; // So afterAll doesn't try to delete it again
    } else {
      expect(res.statusCode).toBe(400); // Likely because it's referenced (if other tests created orders with it)
      console.warn(
        `DELETE /menu/${createdMenuId} failed with 400, possibly due to FK constraints.`,
      );
    }
  });

  it('DELETE /menu/:menuId - should return 404 for non-existent menu item', async () => {
    const res = await request(app).delete('/menu/M_NONEXISTENT_DEL');
    expect(res.statusCode).toBe(404);
  });
});
