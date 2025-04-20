'use client';

import { useState } from 'react';
import MenuTable from '@/components/menu/MenuTable';
import MenuDetail from '@/components/menu/MenuDetail';
import Header from '@/components/layout/Header';

export default function Dashboard() {
  const [selectedMenu, setSelectedMenu] = useState(null);

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-medium">Menu</h1>
              <button className="px-4 py-2 bg-primary text-white rounded-lg">
                Add New Menu
              </button>
            </div>
            <MenuTable onSelectMenu={setSelectedMenu} />
          </div>
          <div className="w-[400px]">
            {selectedMenu && <MenuDetail menu={selectedMenu} />}
          </div>
        </div>
      </main>
    </div>
  );
} 