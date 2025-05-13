'use client';

import Orders from '@/app/orders/page';
import { Order, OrderItem } from './OrderList';

interface OrderDetailProps {
  order: any;
}

export default function OrderDetail({ order }: OrderDetailProps) {
  // Ensure items array exists with a default empty array
  const items = order || {};
  const total = order?.total || 0;
  const orderId = order?.orderId || '';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        <div className="text-sm text-gray-500">#{orderId}</div>
        <button className="text-gray-500 hover:text-gray-700" onClick={() => window.close()}>✕</button>
      </div>

      <div className="space-y-6">
        <h3 className="font-medium">Order List</h3>
        {items != null && items.orderItems ? (
          items.orderItems.map((item: any) => (
            <div key={item.orderItemId} className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    {item.quantity}x
                  </div> 
                  <div>
                    <div className="font-medium">{item.menuName}</div>
                    <div className="text-sm text-gray-500">
                      {item.customizations.map((ing: any) => (
                        <div key={ing.ingredientId} className="flex justify-between">
                          <span>{ing.ingredientName}</span>
                          <span>{ing.customizationCostApplied}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="font-medium">{item.itemTotalPrice}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No items in this order.</div>
        )}

        <div className="pt-4">
          <h3 className="font-medium mb-4">Payment Detail</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-xl font-medium">{items.orderPrice} THB</span>
          </div>
        </div>
      </div>
    </div>
  );
}