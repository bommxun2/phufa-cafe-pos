// src/app/dashboard/page.tsx
'use client';

import { useState, useCallback } from 'react'; // Added useCallback
import MenuTable from '@/components/menu/MenuTable';
import MenuDetail from '@/components/menu/MenuDetail';
import Header from '@/components/layout/Header';
import { useToast } from '@/contexts/ToastContext';
import type { MenuItem, RecipeItem } from '@/types/menu'; // Centralized types
import { API_BASE_URL } from '@/lib/apiConfig';

export default function DashboardPage() { // Renamed Dashboard to DashboardPage
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();
  const [refetchCount, setRefetchCount] = useState(0); // For signaling MenuTable to refetch
  const [isLoadingMenuDetail, setIsLoadingMenuDetail] = useState(false);

  const handleAddMenu = useCallback(() => {
    setIsCreating(true);
    setSelectedMenu(null); // Clear any selected menu
  }, []);

  const handleSelectMenu = useCallback(async (menu: MenuItem) => {
    if (menu.menuId === selectedMenu?.menuId && !isCreating) return; // Avoid re-fetching if already selected

    setIsLoadingMenuDetail(true);
    setSelectedMenu(null); // Clear previous selection first for smoother transition
    setIsCreating(false); // Ensure not in creating mode

    try {
      // MenuTable provides MenuItem without defaultRecipe fully populated with names,
      // MenuDetail needs defaultRecipe. The API GET /menu/{menuId}/recipe returns this.
      const recipeRes = await fetch(`${API_BASE_URL}/menu/${menu.menuId}/recipe`);
      if (!recipeRes.ok) {
        const errorData = await recipeRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load recipe for ${menu.menuName}. Status: ${recipeRes.status}`);
      }
      const recipeData: RecipeItem[] = await recipeRes.json();
      
      // The menu object from MenuTable might already have all necessary fields except resolved recipe.
      // If menu object from table is complete (name, price, etc.), use it.
      setSelectedMenu({ ...menu, defaultRecipe: recipeData });

    } catch (err: any) {
      console.error(`Failed to load details for menu ${menu.menuName}:`, err);
      addToast(`Error loading menu details: ${err.message}`, 'error');
      setSelectedMenu(null); // Clear selection on error
    } finally {
      setIsLoadingMenuDetail(false);
    }
  }, [addToast, selectedMenu?.menuId, isCreating]); // Dependencies for handleSelectMenu

  const handleSaved = useCallback(() => {
    setIsCreating(false);
    setSelectedMenu(null);
    setRefetchCount((prev) => prev + 1); // Signal MenuTable to refetch its data
    // Toast is shown by MenuDetail
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedMenu(null);
    setIsCreating(false);
  }, []);

  return (
    <div className="min-h-screen bg-sage-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-800">Menu Management</h1>
              <button
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                onClick={handleAddMenu}
              >
                + Add New Menu
              </button>
            </div>
            <MenuTable onSelectMenu={handleSelectMenu} refetchSignal={refetchCount} />
          </div>

          <div className="w-full lg:w-auto lg:sticky lg:top-[calc(var(--header-height,68px)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height,68px)-3rem)]">
            {isLoadingMenuDetail ? (
                <div className="bg-white rounded-xl shadow-sm p-6 w-full md:w-[450px] lg:w-[500px] text-center">
                    <p className="text-gray-500 py-10">Loading menu details...</p>
                </div>
            ) : (isCreating || selectedMenu) ? (
              <MenuDetail
                key={isCreating ? 'create-menu' : selectedMenu?.menuId || 'selected-menu'} // Ensure re-mount on change
                menu={selectedMenu}
                isCreating={isCreating}
                onSaved={handleSaved}
                onCancel={handleCancel}
              />
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 w-full md:w-[450px] lg:w-[500px] text-center">
                    <p className="text-gray-500 py-10">Select a menu item to view or edit, or add a new one.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}