// src/components/ProductGrid.tsx
"use client";

import Image from "next/image"; // next/image is imported but not used. Standard img is used.
import { useEffect, useState } from "react";
import axios from "axios";
import type { Product, ProductCustomizableIngredient, ProductIngredientOption } from "@/types/menu"; // Centralized types
import type { IngredientFromAPI } from "@/types/ingredient"; // For typing ingredients from /api/ingredients
import { API_BASE_URL } from "@/lib/apiConfig"; // Import API_BASE_URL

interface ProductGridProps {
  category: string;
  onAddToOrder: (product: Product) => void;
}

export default function ProductGrid({
  category,
  onAddToOrder,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  // Consider adding loading and error states for better UX
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getProducts(currentCategory: string) {
      if (!currentCategory) {
        setProducts([]);
        return;
      }
      // setIsLoading(true);
      // setError(null);
      try {
        const categoryMenuResponse = await axios.get(`${API_BASE_URL}/menu/category/${currentCategory}`);
        const allIngredientsResponse = await axios.get<IngredientFromAPI[]>(`${API_BASE_URL}/ingredients`); // Added type for response

        const fetchedProducts: Product[] = [];
        for (const menuItem of categoryMenuResponse.data) { // Assuming menuItem matches backend structure
          const productIngredients: ProductCustomizableIngredient[] = [];
          
          // Fetch recipe for the current menu item
          const recipeResponse = await axios.get(`${API_BASE_URL}/menu/${menuItem.MenuID}/recipe`); // menuItem.MenuID

          for (const recipeItem of recipeResponse.data) { // Assuming recipeItem structure
            // Fetch details of the specific ingredient in the recipe
            // This is part of the N+1 issue.
            const ingredientDetailResponse = await axios.get<IngredientFromAPI>(
              `${API_BASE_URL}/ingredients/${recipeItem.ingredientId}` // recipeItem.ingredientId
            );
            const defaultIngredientData = ingredientDetailResponse.data;

            const defaultOption: ProductIngredientOption = {
              id: defaultIngredientData.ingredientId,
              name: defaultIngredientData.name,
              // Ensure recipeItem.quantity and defaultIngredientData.unit are valid
              amount: `${recipeItem.quantity} ${defaultIngredientData.unit}`,
            };

            const optionList: ProductIngredientOption[] = [];
            if (recipeItem.isReplaceable == true) { // Explicit boolean check
              allIngredientsResponse.data.forEach((ingredient: IngredientFromAPI) => {
                // Check if the ingredient is in the same category and not the same ingredient
                if (
                  ingredient.category === defaultIngredientData.category && // Compare category IDs
                  ingredient.ingredientId !== defaultIngredientData.ingredientId
                ) {
                  optionList.push({
                    id: ingredient.ingredientId,
                    name: ingredient.name,
                    // Quantity comes from recipeItem, unit from the potential replacement ingredient
                    amount: `${recipeItem.quantity} ${ingredient.unit}`,
                  });
                }
              });
            }

            productIngredients.push({
              default: defaultOption,
              options: optionList,
            });
          }

          fetchedProducts.push({
            id: menuItem.MenuID,
            name: menuItem.MenuName,
            price: Number(menuItem.MenuPrice),
            image: menuItem.MenuURL, // Assuming MenuURL is the correct field for image path
            category: menuItem.MenuCategory,
            status: menuItem.MenuStatus,
            ingredients: productIngredients,
          });
        }
        setProducts(fetchedProducts);
      } catch (err) {
        console.error(`Error fetching menu/category/${currentCategory}:`, err);
        // setError(`Failed to load products for ${currentCategory}.`);
        setProducts([]); // Clear products on error or set to an empty state
      } finally {
        // setIsLoading(false);
      }
    }

    if (category) {
      getProducts(category);
    } else {
      setProducts([]); // Clear products if no category is selected
    }
  }, [category]); // Dependency array is correct

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Add loading and error UI if implemented
      {isLoading && <p>Loading products...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && products.length === 0 && category && <p>No products found in this category.</p>}
      */}
      {products.map((product: Product) => {
        const isUnavailable = product.status === "ไม่พร้อมขาย";

        return (
          <button
            key={product.id}
            onClick={() => !isUnavailable && onAddToOrder(product)}
            disabled={isUnavailable}
            className={`rounded-xl overflow-hidden transition-shadow w-full ${ // Added w-full for consistency
              isUnavailable
                ? "bg-white cursor-not-allowed opacity-50"
                : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <div className="relative h-32 w-full">
              {/* Using <img> tag as per original. Consider Next/Image for optimization if possible. */}
              <img
                src={product.image || '/placeholder-image.png'} // Added placeholder for missing images
                alt={product.name} // Added alt text
                className="object-cover w-full h-full" // Added w-full h-full
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }} // Fallback for broken image links
              />
              {isUnavailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"> {/* Added slight overlay for better text visibility */}
                  <span className="text-red-100 bg-red-600 px-2 py-1 rounded font-semibold text-lg"> {/* Styled "หมด" message */}
                    หมด
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 text-left">
              <div className="font-medium mb-1 text-base truncate" title={product.name}>{product.name}</div> {/* Added truncate and title for long names */}
              <div className="text-sm text-gray-900">{product.price.toFixed(2)} THB</div> {/* Ensure price is formatted */}
            </div>
          </button>
        );
      })}
    </div>
  );
}