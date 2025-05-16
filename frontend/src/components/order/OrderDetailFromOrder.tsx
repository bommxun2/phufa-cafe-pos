// src/components/OrderDetailFromOrder.tsx
"use client";

import { useEffect, useState } from "react"; // Removed useRef as it wasn't used
import axios from "axios";
import type { DisplayOrderDetail, HistoricalOrder } from "@/types/order"; // Use centralized types
import { API_BASE_URL } from "@/lib/apiConfig";
import { useToast } from "@/contexts/ToastContext";

interface OrderDetailProps {
  order: DisplayOrderDetail | null; // Use the specific type for the selected order's details
  // The 'orders' and 'setOrders' props are for updating the list in the parent page after a status change.
  orders: HistoricalOrder[];
  setOrders: React.Dispatch<React.SetStateAction<HistoricalOrder[]>>;
}

export default function OrderDetailFromOrder({ order, orders, setOrders }: OrderDetailProps) {
  const { addToast } = useToast();
  // The 'items' variable was confusing as it was assigned 'order'.
  // Direct use of 'order' prop is clearer.
  const orderId = order?.orderId || "";

  // No local state needed for items if 'order' prop is always up-to-date from parent.

  const handleConfirmOrderPaid = async () => {
    if (!orderId || !order || order.orderStatus === true) {
      addToast("Order is already paid or no order selected.", "info");
      return;
    }

    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}`, {
        orderStatus: true, // Mark as paid
      });

      if (response.status === 200 && response.data) {
        // Update the local list of orders in the parent component
        setOrders(
          orders.map((o) =>
            o.orderId === orderId ? { ...o, orderStatus: true, ...response.data } : o // Spread response.data to get potentially updated order details
          )
        );
        addToast(`Order ${orderId} confirmed as paid.`, "success");
        // The selected 'order' prop will update when the parent's 'selectedOrder' state updates
        // due to the 'orders' list changing.
      } else {
        addToast(`Failed to confirm order ${orderId}. Status: ${response.status}`, "error");
      }
    } catch (err) {
      console.error("Error confirming order:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message) || "An unexpected error occurred.";
      addToast(errorMsg, "error");
    }
  };

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Order Detail</h2>
        </div>
        <div className="text-gray-500 text-center py-10">
          Select an order to see details.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        {orderId && ( // Check orderId specifically, as order object might exist but be empty
          <div className="text-sm text-gray-500">#{orderId}</div>
        )}
      </div>

      <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2"> {/* Scrollable content */}
        <h3 className="font-medium text-md">Order Items</h3>
        {order.orderItems && order.orderItems.length > 0 ? (
          order.orderItems.map((item) => ( // item should be typed based on DisplayOrderDetail.orderItems
            <div
              key={item.orderItemId} // Assuming orderItemId is unique within the order
              className="border-b border-gray-200 pb-3 mb-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3"> {/* Increased gap for readability */}
                  <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium self-start">
                    {item.quantity}x
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.menuName}</div>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 pl-1">
                        <strong>Customizations:</strong>
                        {item.customizations.map((cust) => ( // cust should be typed
                          <div
                            key={cust.ingredientId} // Assuming ingredientId is unique per customization for this item
                            className="flex justify-between"
                          >
                            <span>- {cust.ingredientName}</span>
                            {/* Display cost only if non-zero and makes sense in this context */}
                            {/* <span className="ml-2">({cust.customizationCostApplied > 0 ? `+${cust.customizationCostApplied.toFixed(2)}` : 'Included'})</span> */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-medium text-sm whitespace-nowrap">
                  {item.itemTotalPrice} THB
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 border text-center rounded-md py-4">
            No items in this order.
          </div>
        )}

        <div className="pt-4 border-t mt-4">
          <h3 className="font-medium mb-2 text-md">Payment Detail</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-xl font-semibold">
              {order.orderPrice} THB
            </span>
          </div>
        </div>
        {orderId && order.orderStatus === false && (
          <button
            className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            onClick={handleConfirmOrderPaid}
          >
            Mark as Paid
          </button>
        )}
         {orderId && order.orderStatus === true && (
          <div className="mt-6 text-center text-green-600 font-semibold p-3 bg-green-50 rounded-lg">
            This order has been paid.
          </div>
        )}
      </div>
    </div>
  );
}