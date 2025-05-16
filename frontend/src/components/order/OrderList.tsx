// src/components/OrderList.tsx
"use client"; // Added "use client"

import { useEffect, useState } from "react";
import axios from "axios";
import type { HistoricalOrder, HistoricalOrderItem } from "@/types/order";
import type { Customer } from "@/types/customer";
import type { EmployeeFromAPI } from "@/types/employee";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useToast } from "@/contexts/ToastContext"; // For feedback

interface OrderSummary {
  totalIncome: number;
  orderCount: number;
}

interface OrderListProps {
  onSelectOrder: (order: HistoricalOrder) => void;
  // selectedDate: string; // Not directly used by this component for filtering, parent handles filtering
  orders: HistoricalOrder[];
  customers: Customer[];
  employees: EmployeeFromAPI[];
  setOrders: React.Dispatch<React.SetStateAction<HistoricalOrder[]>>; // Correct type for state setter
  setSummary: (summary: OrderSummary | null) => void; // Correct type for summary setter
}

export default function OrderList({
  onSelectOrder,
  // selectedDate, // Removed as not directly used for filtering here
  orders,
  customers,
  employees,
  setOrders,
  setSummary,
}: OrderListProps) {
  const { addToast } = useToast();

  function getCustomerName(citizenId: string | null | undefined): string {
    if (!citizenId) return "-";
    const c = customers.find((cust: Customer) => cust.citizenId === citizenId);
    return c ? `${c.firstname} ${c.lastname}` : "Unknown Customer";
  }

  function getEmployeeName(empId: string | null | undefined): string {
    if (!empId) return "-";
    const e = employees.find((emp: EmployeeFromAPI) => emp.empId === empId);
    return e ? `${e.firstname} ${e.lastname}` : "Unknown Employee";
  }

  function formatDateTime(dateString: string | undefined): string {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date"; // Check for invalid date
      const datePart = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timePart = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${datePart} ${timePart}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date Error";
    }
  }

  const handleDelete = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when deleting
    const confirmDelete = window.confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone if the order is already processed by the backend.`);
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      if (response.status === 204 || response.status === 200) { // 200 if backend returns a message
        setOrders((prevOrders) => prevOrders.filter((order) => order.orderId !== orderId));
        addToast(`Order ${orderId} deleted successfully.`, "success");
      } else {
        const errorData = response.data;
        addToast(errorData?.message || `Failed to delete order ${orderId}. Status: ${response.status}`, "error");
      }
    } catch (err) {
      console.error(`Error deleting order ${orderId}:`, err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message) || "An unexpected error occurred while deleting the order.";
      addToast(errorMsg, "error");
    }
  };

  useEffect(() => {
    if (!orders || !Array.isArray(orders)) {
      setSummary(null); // Reset summary if orders are invalid
      return;
    }

    const completedOrders = orders.filter((o: HistoricalOrder) => o.orderStatus === true);

    let totalIncome = 0;
    completedOrders.forEach((o) => {
      // Ensure orderPrice is a number before adding
      const price = parseFloat(String(o.orderPrice));
      if (!isNaN(price)) {
        totalIncome += price;
      }
    });

    const orderCount = completedOrders.length;

    setSummary({
      totalIncome,
      orderCount,
    });
  }, [orders, setSummary]); // Added setSummary to dependencies

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto"> {/* Make table scrollable on small screens */}
        <table className="w-full min-w-[800px]"> {/* Min width to prevent cramping */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                  No orders found for the selected criteria.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.orderId}
                onClick={() => onSelectOrder(order)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.orderId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDateTime(order.orderDateTime)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-[150px]" title={getCustomerName(order.orderByCitizenId)}>
                  {getCustomerName(order.orderByCitizenId)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-[150px]" title={getEmployeeName(order.orderMakerEmpId)}>
                  {getEmployeeName(order.orderMakerEmpId)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {/* Assuming order.orderItems is an array from the API response */}
                  {Array.isArray(order.orderItems) ? order.orderItems.length : order.menuCount || 0}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-sm text-gray-700">
                  {order.orderPrice !== undefined && order.orderPrice !== null && !isNaN(Number(order.orderPrice))
                    ? Number(order.orderPrice).toFixed(2)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.orderStatus
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.orderStatus ? "Paid" : "In-Progress"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap text-sm">
                  {order.orderStatus === true ? ( // If paid, disable delete
                    <button
                      className="text-gray-400 cursor-not-allowed p-1"
                      disabled
                      title="Cannot delete paid orders"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                      onClick={(e) => handleDelete(order.orderId, e)}
                      title="Delete Order"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}