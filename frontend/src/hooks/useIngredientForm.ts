// src/hooks/useIngredientForm.ts (สร้างไฟล์ใหม่)
import { useState, useEffect, useCallback } from "react";

// นำ type Ingredient และ IngredientCategory มาใช้
// ควรจะ import มาจากที่เดียวนะครับ ถ้ามีการแชร์ type
// สมมติว่า type เหล่านี้ถูก define ใน src/types/ingredient.ts
// import { Ingredient, IngredientCategory } from '@/types/ingredient';

// --- สมมติว่า type ถูก define ที่นี่เพื่อความง่ายในการแสดงตัวอย่าง ---
type Ingredient = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string; // ใน IngredientDetail จะเก็บ category ID
};

type IngredientCategory = {
  ingredientCategoryId: string;
  name: string;
  allowMultipleSelection: boolean;
  isCustomizable: boolean;
};
// --- จบส่วนสมมติ type ---

const defaultNewIngredientValues: Omit<Ingredient, "ingredientId"> = {
  name: "",
  quantity: 0,
  unit: "",
  adjustmentPrice: 0,
  costPerUnit: 0,
  category: "", // Will be categoryId
};

interface UseIngredientFormProps {
  initialData?: Ingredient;
  isCreating: boolean;
  categories: IngredientCategory[];
}

export function useIngredientForm({
  initialData,
  isCreating,
  categories,
}: UseIngredientFormProps) {
  const getInitialFormData = useCallback(() => {
    if (isCreating) {
      return {
        ...defaultNewIngredientValues,
        category: categories[0]?.ingredientCategoryId || "", // Default to first category ID
      };
    }
    return {
      ...initialData, // initialData.category is already categoryId
      category:
        initialData?.category || categories[0]?.ingredientCategoryId || "",
    };
  }, [initialData, isCreating, categories]);

  const [formData, setFormData] =
    useState<Partial<Ingredient>>(getInitialFormData);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ||
        name === "adjustmentPrice" ||
        name === "costPerUnit"
          ? parseFloat(value)
          : value,
    }));
  };

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  return {
    formData,
    setFormData, // อาจจะไม่จำเป็นต้อง expose ถ้า resetForm ครอบคลุม
    handleInputChange,
    resetForm,
  };
}
