"use client";

export interface Category {
  id: number;
  name: string;
  itemCount: number;
}

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  menuCategory: Category[];
}

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  menuCategory,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {menuCategory.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.name)}
          className={`
            p-4 rounded-xl text-left transition-colors
            ${
              selectedCategory === category.name
                ? "bg-primary text-white"
                : "bg-white hover:bg-gray-50"
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
                ? "text-white/80"
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
