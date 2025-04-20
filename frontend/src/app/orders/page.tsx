'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import OrderList from '@/components/OrderList';
import OrderDetail from '@/components/OrderDetail';

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-medium">April 2025</h1>
                <div className="flex items-center gap-4 ml-8">
                  <div className="bg-primary text-white px-6 py-4 rounded-lg">
                    <div className="text-sm mb-1">Sales</div>
                    <div className="text-2xl font-medium">52,540.00</div>
                  </div>
                  <div className="bg-[#003D5B] text-white px-6 py-4 rounded-lg">
                    <div className="text-sm mb-1">Orders</div>
                    <div className="text-2xl font-medium">1080</div>
                  </div>
                </div>
              </div>
            </div>
            <OrderList onSelectOrder={setSelectedOrder} />
          </div>
          <div className="w-[400px]">
            {selectedOrder && <OrderDetail order={selectedOrder} />}
          </div>
        </div>
      </main>
    </div>
  );
} 