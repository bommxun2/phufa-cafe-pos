'use client';

import { useEffect, useState } from 'react';
export interface MenuItem {
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuPrice: number;
  menuStatus: string;
  menuCategory: string;
  menuUrl: string;
  defaultRecipe: any[];
}

interface MenuTableProps {
  onSelectMenu: (menu: MenuItem | null) => void;
}


export default function MenuTable({ onSelectMenu }: MenuTableProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) {
          throw new Error('Cannot load menu');
        }
        const data = await res.json();
        setMenuItems(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  if (loading) return <p>Loading menu...</p>;
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">MenuID</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Description</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Image</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {menuItems.map((item) => (
            <tr
              key={item.menuId}
              onClick={() => onSelectMenu({ ...item, defaultRecipe: [] })}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuId}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuStatus}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuName}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuDescription}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuPrice}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuCategory}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuUrl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 