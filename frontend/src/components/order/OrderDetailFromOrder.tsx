"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface OrderDetailProps {
  order: any;
  orders: any[];
  setOrders: any[];
}

export default function OrderDetail({ order, orders, setOrders }: OrderDetailProps) {
  const items = order || {};
  const orderId = order?.orderId || "";

  const handleConfirm = async () => {
    const res = await axios.patch(`/api/orders/${orderId}`, {
      orderStatus: true,
    });
    if (res.status === 200) {
      setOrders(
        orders.map((o) =>
          o.orderId === orderId ? { ...o, orderStatus: true } : o
        )
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        {orderId != "" ? (
          <div className="text-sm text-gray-500">#{orderId}</div>
        ) : (
          <div className="text-sm text-gray-500"></div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="font-medium">Order List</h3>
        {items != null && items.orderItems ? (
          items.orderItems.map((item: any) => (
            <div
              key={item.orderItemId}
              className="border-b border-gray-200 pb-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 self-start text-red-800 px-2 py-1 rounded text-sm">
                    {item.quantity}x
                  </div>
                  <div>
                    <div className="font-medium">{item.menuName}</div>
                    <div className="text-sm text-gray-500">
                      {item.customizations.map((ing: any) => (
                        <div
                          key={ing.ingredientId}
                          className="flex justify-between"
                        >
                          <span>{ing.ingredientName}</span>
                          <span className="ml-10">{ing.customizationCostApplied}</span>
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
          <div className="text-gray-500 border text-center rounded-md py-2">
            No items in this order.
          </div>
        )}

        <div className="pt-4">
          <h3 className="font-medium mb-4">Payment Detail</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-xl font-medium">{items.orderPrice} THB</span>
          </div>
        </div>
        {orderId !== "" && order.orderStatus === false && (
          <button
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            onClick={handleConfirm}
          >
            Confirm Order
          </button>
        )}
      </div>
    </div>
  );
}
