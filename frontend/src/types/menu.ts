// src/types/menu.ts

// From components/menu/MenuDetail.tsx and components/menu/MenuTable.tsx
export interface RecipeItem {
  categoryId: string; // Ingredient Category ID
  ingredientId: string;
  quantity: number;
  isBaseIngredient: boolean;
  isReplaceable: boolean;
}

export interface MenuItem {
  menuId?: string; // Optional for creation, present for existing
  menuName: string;
  menuPrice: number;
  menuStatus: string; // e.g., "พร้อมขาย", "ไม่พร้อมขาย"
  menuCategory: string; // Name of the menu category, e.g., "กาแฟ", "ชา"
  menuDescription: string;
  menuUrl: string; // Relative URL for the image
  defaultRecipe: RecipeItem[];
}

// From components/ProductGrid.tsx - slightly different structure for POS display
export interface ProductIngredientOption {
  // Was 'everyIngredients'
  id: string; // ingredientId
  name: string;
  amount: string; // e.g., "50 กรัม"
}

export interface ProductCustomizableIngredient {
  // Was 'Ingredients' in ProductGrid
  default: ProductIngredientOption;
  options: ProductIngredientOption[];
}

export interface Product {
  id: string; // MenuID
  name: string; // MenuName
  price: number; // MenuPrice
  image: string; // MenuURL
  category: string; // MenuCategory
  status: string; // MenuStatus
  ingredients?: ProductCustomizableIngredient[]; // For POS customization
}

// From components/CategoryGrid.tsx
export interface ProductCategory {
  // Was 'Category' in CategoryGrid
  id: number | string; // Can be number or string depending on source
  name: string;
  itemCount: number;
}
