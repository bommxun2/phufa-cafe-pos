// src/components/CategoryGrid.tsx
"use client";

import type { ProductCategory } from "@/types/menu"; // Use centralized type

interface CategoryGridProps {
  selectedCategory: string; // Name of the category
  onSelectCategory: (categoryName: string) => void;
  menuCategory: ProductCategory[]; // Array of category objects
}

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  menuCategory,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6"> {/* Responsive columns */}
      {menuCategory.map((category) => (
        <button
          key={category.id} // Assuming category.id is unique (number or string)
          onClick={() => onSelectCategory(category.name)}
          className={`
            p-4 rounded-xl text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
            ${
              selectedCategory === category.name
                ? "bg-primary text-white shadow-lg" // Added shadow for selected
                : "bg-white hover:bg-gray-50 shadow-sm hover:shadow-md" // Standard shadow
            }
          `}
        >
          <div
            className={`text-lg font-medium ${
              selectedCategory === category.name
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            {category.name}
          </div>
          <div
            className={`text-sm ${
              selectedCategory === category.name
                ? "text-white/80" // Slightly transparent for subtext
                : "text-gray-500"
            }`}
          >
            {category.itemCount} items
          </div>
        </button>
      ))}
    </div>
  );
}