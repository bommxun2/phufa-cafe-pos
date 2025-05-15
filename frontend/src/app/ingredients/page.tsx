// src/app/ingredients/page.tsx
"use client"; // Ensure this is a client component

import IngredientDetail from "@/components/ingredient/IngredientDetail";
import Header from "@/components/layout/Header";
import { useEffect, useState, useMemo } from "react";
// หาก ToastProvider อยู่ใน layout.tsx และใช้ context
// import { useToast } from "@/app/layout";
// หรือถ้า ToastProvider อยู่ใน page นี้โดยตรง
// import useToastHook, { ToastContainer } from '@/components/common/Toast';

// --- Types (เหมือนเดิม) ---
type IngredientFromAPI = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string;
};
type IngredientFormData = {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string;
};
type IngredientCategory = {
  ingredientCategoryId: string;
  name: string;
  allowMultipleSelection: boolean;
  isCustomizable: boolean;
};
type IngredientDisplay = Omit<IngredientFromAPI, "category"> & {
  categoryId: string;
  categoryName: string;
};
// --- จบ Types ---

export default function IngredientsPage() {
  const [allIngredientsFromAPI, setAllIngredientsFromAPI] = useState<
    IngredientFromAPI[]
  >([]);
  const [ingredientCategories, setIngredientCategories] = useState<
    IngredientCategory[]
  >([]);

  const [activeIngredient, setActiveIngredient] = useState<
    IngredientFormData | null | "NEW"
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { addToast } = useToast(); // หากใช้ global context
  // หรือถ้าใช้ local toast state:
  // const { toasts, addToast, removeToast } = useToastHook();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/ingredients").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      }),
      fetch("/api/ingredient-categories").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredient categories");
        return res.json();
      }),
    ])
      .then(
        ([ingredientsData, categoriesData]: [
          IngredientFromAPI[],
          IngredientCategory[]
        ]) => {
          setAllIngredientsFromAPI(ingredientsData);
          setIngredientCategories(categoriesData);
        }
      )
      .catch((error) => {
        console.error("Error fetching initial data:", error);
        // addToast(`Error fetching data: ${error.message}`, "error"); // ใช้ toast แทน alert
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Removed addToast from dependency array if it's from context

  const ingredientsForDisplay = useMemo((): IngredientDisplay[] => {
    if (!ingredientCategories.length) return [];
    return allIngredientsFromAPI.map((ing) => {
      const category = ingredientCategories.find(
        (cat) => cat.ingredientCategoryId === ing.category
      );
      return {
        ...ing,
        categoryId: ing.category,
        categoryName: category ? category.name : "Unknown",
      };
    });
  }, [allIngredientsFromAPI, ingredientCategories]);

  const handleAddNewIngredientClick = () => {
    setActiveIngredient("NEW");
  };

  const handleSelectIngredient = (ingredient: IngredientFromAPI) => {
    setActiveIngredient({ ...ingredient });
  };

  const handleSaveSuccess = (
    savedApiIngredient: IngredientFromAPI,
    mode: "create" | "update"
  ) => {
    if (mode === "create") {
      setAllIngredientsFromAPI((prev) => [...prev, savedApiIngredient]);
    } else {
      setAllIngredientsFromAPI((prev) =>
        prev.map((ing) =>
          ing.ingredientId === savedApiIngredient.ingredientId
            ? savedApiIngredient
            : ing
        )
      );
    }
    setActiveIngredient(null);
    // Toast แสดงจาก IngredientDetail
  };

  const handleDeleteSuccess = (deletedIngredientId: string) => {
    setAllIngredientsFromAPI((prev) =>
      prev.filter((ing) => ing.ingredientId !== deletedIngredientId)
    );
    setActiveIngredient(null);
    // Toast แสดงจาก IngredientDetail
  };

  const handleCancelDetail = () => {
    setActiveIngredient(null);
  };

  if (
    isLoading &&
    allIngredientsFromAPI.length === 0 &&
    ingredientCategories.length === 0
  ) {
    // ... loading UI ...
    return (
      <div className="min-h-screen bg-sage-100">
        <Header />
        <main className="container mx-auto p-6">
          <p>Loading data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        {/* <ToastContainer toasts={toasts} removeToast={removeToast} />  // ถ้า ToastProvider ไม่ได้อยู่ที่ layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-medium">Ingredients</h1>
              <button
                onClick={handleAddNewIngredientClick}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Add New Ingredient
              </button>
            </div>
            {ingredientsForDisplay.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                No ingredients found.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingredient ID
                        </th>
                        <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientsForDisplay.map((ingredientDisp) => {
                        const originalIngredient = allIngredientsFromAPI.find(
                          (i) => i.ingredientId === ingredientDisp.ingredientId
                        );
                        return (
                          <tr
                            key={ingredientDisp.ingredientId}
                            onClick={() =>
                              originalIngredient &&
                              handleSelectIngredient(originalIngredient)
                            }
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ingredientDisp.ingredientId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ingredientDisp.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ingredientDisp.quantity} {ingredientDisp.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ingredientDisp.categoryName}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {activeIngredient !== null && (
            <div className="w-full lg:w-[400px] lg:sticky lg:top-6 self-start">
              <IngredientDetail
                key={
                  typeof activeIngredient === "string"
                    ? "new-ingredient-form"
                    : activeIngredient.ingredientId
                }
                ingredient={
                  typeof activeIngredient === "object"
                    ? activeIngredient
                    : undefined
                }
                categories={ingredientCategories}
                onSaveSuccess={handleSaveSuccess}
                onDeleteSuccess={handleDeleteSuccess}
                onCancel={handleCancelDetail}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
