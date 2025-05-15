'use client';

import { useState } from 'react';
import MenuTable from '@/components/menu/MenuTable';
import MenuDetail from '@/components/menu/MenuDetail';
import Header from '@/components/layout/Header';
import type { MenuItem } from '@/components/menu/MenuDetail';

export default function Dashboard() {
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);//click on "Add New Menu" button to change to add menu mode

  const handleAddMenu = () => {
    setIsCreating(true);
    setSelectedMenu(null); // ล้างเมนูที่เลือกไว้ก่อน
  };

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-medium">Menu</h1>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-lg"
                onClick={handleAddMenu}>
                Add New Menu
              </button>
            </div>
            <MenuTable onSelectMenu={(menu) => {
              setSelectedMenu(menu);
              setIsCreating(false);
            }} />
          </div>
          
          <div className="w-[400px]">
            {(isCreating || selectedMenu) && (
              <MenuDetail
                menu={selectedMenu} 
                isCreating={isCreating}
                onSaved={() => {
                setIsCreating(false);
                setSelectedMenu(null);
              }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 