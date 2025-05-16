// src/components/menu/MenuTable.tsx
'use client';

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types/menu'; // Use centralized type
import { API_BASE_URL } from '@/lib/apiConfig'; // Import API_BASE_URL

interface MenuTableProps {
  onSelectMenu: (menu: MenuItem) => void | Promise<void>;
  refetchSignal?: number;
}

export default function MenuTable({ onSelectMenu, refetchSignal }: MenuTableProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/menu`); // Use API_BASE_URL
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to load Menu. Status: ${res.status}` }));
        throw new Error(errorData.message || `Failed to load Menu. Status: ${res.status}`);
      }
      const data = await res.json();
      setMenuItems(data as MenuItem[]); // Assert type if confident in API response
    } catch (err: any) {
      console.error('Error occurred when loading Menu:', err);
      setError(err.message || 'An unexpected error occurred while fetching menus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [refetchSignal]); // fetchMenus can be added if its definition changes based on props/state not just constants

  if (loading) return <p className="p-4 text-center">Loading menu...</p>;
  if (error) return <p className="p-4 text-center text-red-600">Error: {error}</p>;
  if (menuItems.length === 0) return <p className="p-4 text-center text-gray-500">No menu items found.</p>;


  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto"> {/* For responsiveness */}
        <table className="w-full min-w-[900px]"> {/* Minimum width */}
          <thead className="bg-gray-50">
            <tr>
              {/* Consider reducing columns or making some optional for smaller views if needed */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {menuItems.map((item) => (
              <tr
                key={item.menuId}
                onClick={() => onSelectMenu(item)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.menuId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                   <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       item.menuStatus === 'พร้อมขาย' ? 'bg-green-100 text-green-800' :
                       item.menuStatus === 'ไม่พร้อมขาย' ? 'bg-red-100 text-red-800' :
                       'bg-yellow-100 text-yellow-800' /* Default for other statuses */
                   }`}>
                       {item.menuStatus}
                   </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.menuName}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.menuDescription}>{item.menuDescription || "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{item.menuPrice}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.menuCategory}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.menuUrl}>{item.menuUrl || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}