'use client';

interface Category {
  id: string;
  name: string;
  itemCount: number;
}

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryGrid({ selectedCategory, onSelectCategory }: CategoryGridProps) {
  const categories: Category[] = [
    { id: 'coffee', name: 'Coffee', itemCount: 50 },
    { id: 'tea', name: 'Tea', itemCount: 30 },
    { id: 'juice', name: 'Juice', itemCount: 20 },
    { id: 'smoothie', name: 'Smoothie', itemCount: 15 },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.name)}
          className={`
            p-4 rounded-xl text-left transition-colors
            ${
              selectedCategory === category.name
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-gray-50'
            }
          `}
        >
          <div className={`text-lg font-medium ${
            selectedCategory === category.name ? 'text-white' : 'text-gray-900'
          }`}>
            {category.name}
          </div>
          <div className={`text-sm ${
            selectedCategory === category.name ? 'text-white/80' : 'text-gray-500'
          }`}>
            {category.itemCount} items
          </div>
        </button>
      ))}
    </div>
  );
} 