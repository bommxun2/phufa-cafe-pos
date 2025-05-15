'use client';

import { useState, useEffect } from 'react';

interface Ingredient {
  ingredientId: string;
  name: string;
}

interface Category {
  ingredientCategoryId: string;
  name: string;
}
export interface RecipeItem {
  categoryId: string;
  ingredientId: string;
  quantity: number;
}
export interface MenuItem {
  menuId?: string;
  menuName: string;
  menuPrice: number;
  menuStatus: string;
  menuDescription: string;
  menuUrl: string;
  menuCategory: string;
  defaultRecipe: RecipeItem[];
}

interface MenuDetailProps {
  menu: MenuItem | null;
  isCreating?: boolean;
  onSaved?: () => void;
}

export default function MenuDetail({ menu, isCreating, onSaved }: MenuDetailProps) {
  const [form, setForm] = useState<MenuItem>({
    menuName: '',
    menuPrice: 0,
    menuStatus: 'พร้อมขาย',
    menuDescription: '',
    menuUrl: '',
    menuCategory: '',
    defaultRecipe: []
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredientsByCategory, setIngredientsByCategory] = useState<Record<string, Ingredient[]>>({});

  // โหลดหมวดหมู่
  useEffect(() => {
    fetch('/api/ingredient-categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Load categories failed:', err));
  }, []);

   //โหลดข้อมูล menu
  useEffect(() => {
    if (menu && !isCreating) {
      setForm(menu);
    } else {
      setForm({
        menuName: '',
        menuPrice: 0,
        menuStatus: 'พร้อมขาย',
        menuDescription: '',
        menuUrl: '',
        menuCategory: '',
        defaultRecipe: []
      });
    }
  }, [menu, isCreating]);

  // โหลดวัตถุดิบตาม category
  const loadIngredients = async (categoryId: string) => {
    if (ingredientsByCategory[categoryId]) return;
    try {
      const res = await fetch(`/api/ingredient-categories/${categoryId}/ingredients`);
      const data = await res.json();
      setIngredientsByCategory(prev => ({ ...prev, [categoryId]: data }));
    } catch (err) {
      console.error('Load ingredients failed:', err);
    }
  };

  const handleChange = (field: keyof MenuItem, value: any) => {
    setForm({ ...form, [field]: value });
  };

   const handleRecipeChange = (
    index: number,
    field: keyof RecipeItem,
    value: string | number
  ) => {
    const updated = [...form.defaultRecipe];
    updated[index][field] = value as never;

    if (field === 'categoryId') loadIngredients(value as string);
    setForm({ ...form, defaultRecipe: updated });
  };

   const handleAddRecipe = () => {
    if (categories.length === 0) {
      alert('No Ingredient Category yet');
      return;
    }
    const firstCategoryId = categories[0].ingredientCategoryId;
    loadIngredients(firstCategoryId);

    setForm({
      ...form,
      defaultRecipe: [
        ...form.defaultRecipe,
        {
          categoryId: firstCategoryId,
          ingredientId: '',
          quantity: 0
        }
      ]
    });
  };

   const handleRemoveRecipe = (index: number) => {
    const updated = [...form.defaultRecipe];
    updated.splice(index, 1);
    setForm({ ...form, defaultRecipe: updated });
  };

  const handleSave = async () => {
    try {
      const isEditing = !!form.menuId;
      const url = isEditing
        ? `/api/menu/${form.menuId}` // แก้ไข
        : '/api/menu';              // สร้างใหม่
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

      if (!res.ok) throw new Error(isEditing ? 'Failed to edit menu' : 'Failed to Create menu');
      const message = isEditing ? 'Update Menu Successfully' : 'Create Menu Successfully';
      alert(message);
      onSaved?.(); // เรียก callback ให้ parent รีเฟรชหรือปิด form
    } catch (err: any) {
      alert('Error occurred: ' + err.message);
    }
  };
  
  const handleDelete = async () => {
  if (!form.menuId) return;

  const confirmDelete = confirm('Are you sure you want to delete this Menu?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/menu/${form.menuId}`, {
      method: 'DELETE',
    });

    if (res.status === 204) {
      alert('Delete Menu Successfully');
      onSaved?.();
    } else if (res.status === 404) {
      alert('Menu Not Found!');
    } else {
      const data = await res.json();
      alert(`Error occurred: ${data.message || 'Cannot Delete Menu'}`);
    }
  } catch (error: any) {
    alert('Error occurred: ' + error.message);
  }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
  
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold mb-4">
        {isCreating ? 'Add New Menu' : form.menuId}
        </h2>
        
        {!isCreating && form.menuId && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mb-4"
            onClick={handleDelete}
          >
            Delete Menu
          </button>
          )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={form.menuStatus}
            onChange={(e) => handleChange('menuStatus', e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="พร้อมขาย">Sellable</option>
            <option value="ไม่พร้อมขาย">Not Sellable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Menu ID</label>
          <input
            type="text"
            value={form.menuId}
            onChange={(e) => handleChange('menuId', e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={form.menuName}
            onChange={(e) => handleChange('menuName', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.menuDescription}
            onChange={(e) => handleChange('menuDescription', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            value={form.menuPrice}
            onChange={(e) => handleChange('menuPrice', Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={form.menuCategory}
            onChange={(e) => handleChange('menuCategory', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        {/* ส่วนวัตถุดิบ */}
          <div className="mt-6">
          <h3 className="block text-sm font-medium text-gray-700">DefaultRecipe</h3>
          {form.defaultRecipe.map((item, index) => {
            const ingredients = ingredientsByCategory[item.categoryId] || [];
            return (
              <div key={index} className="border p-3 mb-3 rounded space-y-2">
                <select
                  value={item.categoryId}
                  onChange={(e) =>
                    handleRecipeChange(index, 'categoryId', e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                >
                  {categories.map((cat) => (
                    <option key={cat.ingredientCategoryId} value={cat.ingredientCategoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={item.ingredientId}
                  onChange={(e) =>
                    handleRecipeChange(index, 'ingredientId', e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Choose Ingredient</option>
                  {ingredients.map((ing) => (
                    <option key={ing.ingredientId} value={ing.ingredientId}>
                      {ing.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  //placeholder="ปริมาณ"
                  value={item.quantity}
                  onChange={(e) =>
                    handleRecipeChange(index, 'quantity', Number(e.target.value))
                  }
                  className="w-full border rounded px-2 py-1"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveRecipe(index)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            );
          })}

          <button
          type="button"
          onClick={handleAddRecipe}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          + Add Ingredient
        </button>
      </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input
            type="text"
            value={form.menuUrl}
            onChange={(e) => handleChange('menuUrl', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      <button
      onClick={handleSave} 
      className="mt-6 w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
        Save
      </button>
    </div>
  );
} 