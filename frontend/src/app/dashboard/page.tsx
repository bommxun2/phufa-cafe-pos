'use client';

import { useState } from 'react';
import MenuTable,{ MenuItem} from '@/components/menu/MenuTable';
import MenuDetail from '@/components/menu/MenuDetail';
import Header from '@/components/layout/Header';
import { useToast } from '@/contexts/ToastContext';

export default function Dashboard() {
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);//click on "Add New Menu" button to change to add menu mode
  const { addToast } = useToast();
  const [refetchCount, setRefetchCount] = useState(0);

  const handleAddMenu = () => {
    setIsCreating(true);
    setSelectedMenu(null); // ล้างเมนูที่เลือกไว้ก่อน
  };

  const handleSelectMenu = async (menu: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/${menu.menuId}/recipe`);
      if (!res.ok) throw new Error('Failed to load Recipe');
      
      const recipe = await res.json();
      setSelectedMenu({ ...menu, defaultRecipe: recipe });
      setIsCreating(false);
    } catch (err:any) {
      console.error('Failed to load Recipe:', err);
      addToast('Error occurred when loading DefaultRecipe', 'error');
    }
  };

  const handleSaved = () => {
    setIsCreating(false);
    setSelectedMenu(null);
    setRefetchCount((prev) => prev + 1); // บอก MenuTable ให้โหลดใหม่
  };

  const handleCancel = () => {
  setSelectedMenu(null);
  setIsCreating(false);
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
            <MenuTable onSelectMenu={handleSelectMenu} refetchSignal={refetchCount} />
          </div>
          
          <div>
            {(isCreating || selectedMenu) && (
              <MenuDetail
                menu={selectedMenu}
                isCreating={isCreating}
                onSaved={handleSaved}
                onCancel={handleCancel}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
} 