// src/services/menuApi.ts (New or existing file)
import type { MenuItem, RecipeItem } from "@/types/menu"; // Assuming MenuItem, etc. are defined
import { API_BASE_URL } from "@/lib/apiConfig";
import { handleApiResponse } from "@/lib/handleApiResponse";

// Define FileUploadResponse if not already globally available
interface FileUploadResponse {
  message: string;
  fileUrl: string; // Relative URL path
}

export const menuApi = {
  // ... other menu API functions (getAll, getById, create, update, deleteRecipe, etc.)

  // Example: Get all menu items
  getAll: async (): Promise<MenuItem[]> => {
    // MenuItem should include defaultRecipe potentially
    const response = await fetch(`${API_BASE_URL}/menu`);
    return handleApiResponse<MenuItem[]>(response);
  },

  // Example: Get menu item by ID (might include recipe)
  getById: async (menuId: string): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuId}`);
    return handleApiResponse<MenuItem>(response);
  },

  // Example: Get recipe for a menu
  getRecipe: async (menuId: string): Promise<RecipeItem[]> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuId}/recipe`);
    return handleApiResponse<RecipeItem[]>(response);
  },

  // Example: Create menu item
  create: async (payload: MenuItem): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE_URL}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<MenuItem>(response);
  },

  // Example: Update menu item
  update: async (
    menuId: string,
    payload: Partial<MenuItem>
  ): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<MenuItem>(response);
  },

  // Example: Delete menu item
  delete: async (menuId: string): Promise<null> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuId}`, {
      method: "DELETE",
    });
    return handleApiResponse<null>(response);
  },

  // New function for uploading menu image
  uploadMenuImage: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("menuImage", file); // Key 'menuImage' must match backend expectation

    const response = await fetch(`${API_BASE_URL}/uploads/menu-image`, {
      // Your dedicated endpoint
      method: "POST",
      body: formData,
      // Headers are set automatically by browser for FormData with files
    });
    return handleApiResponse<FileUploadResponse>(response);
  },
};
