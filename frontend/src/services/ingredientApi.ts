// src/services/ingredientApi.ts (สร้างไฟล์ใหม่)
// import { Ingredient, IngredientCreatePayload, IngredientUpdatePayload } from '@/types/ingredient';

// --- สมมติว่า type ถูก define ที่นี่เพื่อความง่ายในการแสดงตัวอย่าง ---
type Ingredient = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string; // This is category ID
};

type IngredientFromAPI = {
  // Raw from API endpoint for GET /ingredients
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string; // This is category ID from API
};

// For POST /ingredients, API expects category NAME
type IngredientCreatePayload = {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string; // This is category NAME
};

// For PUT /ingredients/{id}, API expects category ID
type IngredientUpdatePayload = {
  name?: string;
  quantity?: number;
  unit?: string;
  adjustmentPrice?: number;
  costPerUnit?: number;
  category?: string; // This is category ID
};
// --- จบส่วนสมมติ type ---

const API_BASE_URL = "/api";

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok && response.status !== 204) {
    // 204 is success with no content (for DELETE)
    const errorData = await response
      .json()
      .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  if (response.status === 204) {
    return null as T; // Or an appropriate empty success object
  }
  return response.json();
}

export const ingredientApi = {
  create: async (
    payload: IngredientCreatePayload
  ): Promise<IngredientFromAPI> => {
    const response = await fetch(`${API_BASE_URL}/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<IngredientFromAPI>(response);
  },

  update: async (
    ingredientId: string,
    payload: IngredientUpdatePayload
  ): Promise<IngredientFromAPI> => {
    const response = await fetch(
      `${API_BASE_URL}/ingredients/${ingredientId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return handleApiResponse<IngredientFromAPI>(response);
  },

  delete: async (ingredientId: string): Promise<null> => {
    const response = await fetch(
      `${API_BASE_URL}/ingredients/${ingredientId}`,
      {
        method: "DELETE",
      }
    );
    return handleApiResponse<null>(response);
  },
};
