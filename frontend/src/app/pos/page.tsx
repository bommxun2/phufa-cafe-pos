'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';
import OrderDetail from '@/components/OrderDetail';

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState('Coffee');
  const [currentOrder, setCurrentOrder] = useState({
    orderId: 'O265980021',
    items: [],
    total: 0
  });

  const handleAddToOrder = (product) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: [...prev.items, {
        name: product.name,
        quantity: 1,
        price: product.price,
        ingredients: product.ingredients || []
      }],
      total: prev.total + product.price
    }));
  };

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-none shadow-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <CategoryGrid
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <ProductGrid
              category={selectedCategory}
              onAddToOrder={handleAddToOrder}
            />
          </div>
          <div className="w-[400px]">
            <OrderDetail order={currentOrder} />
          </div>
        </div>
      </main>
    </div>
  );
} 