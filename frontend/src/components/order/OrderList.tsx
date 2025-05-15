import { useEffect, useState } from "react";
import axios from "axios";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  ingredients: {
    name: string;
    amount: string;
  }[];
}

export interface Order {
  orderId: string;
  dateTime: string;
  customer: string;
  employee: string;
  menuCount: number;
  total: number;
  items?: OrderItem[];
}

interface OrderListProps {
  onSelectOrder: (order: any) => void;
  selectedDate: string;
  orders: any[];
  customers: any[];
  employees: any[];
  setOrders: any[];
  setSummary: (sum: any) => void;
}

export default function OrderList({
  onSelectOrder,
  selectedDate,
  orders,
  customers,
  employees,
  setOrders,
  setSummary,
}: OrderListProps) {
  function getCustomerName(citizenId: string) {
    const c = customers.find((c: any) => c.citizenId === citizenId);
    return c ? `${c.firstname} ${c.lastname}` : "-";
  }
  function getEmployeeName(empId: string) {
    const e = employees.find((e: any) => e.empId === empId);
    return e ? `${e.firstname} ${e.lastname}` : "-";
  }

  function formatDateTime(dateString: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
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
  }

  const handleDelete = async (orderId: any) => {
    const res = await axios.delete(`/api/orders/${orderId}`);
    setOrders(orders.filter((order) => order.orderId !== orderId));
  };

  useEffect(() => {
    if (!orders || !Array.isArray(orders)) return;

    const completedOrders = orders.filter((o: any) => o.orderStatus === true);

    let totalIncome = 0;
    completedOrders.forEach((o) => {
      totalIncome += parseFloat(o.orderPrice);
    });

    const orderCount = completedOrders.length;

    setSummary({
      totalIncome,
      orderCount,
    });
  }, [orders]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              OrderID
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              DateTime
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Customer
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Employee
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Menu#
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Total
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr
              key={order.orderId}
              onClick={() => onSelectOrder(order)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">
                {order.orderId}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {formatDateTime(order.orderDateTime)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {getCustomerName(order.orderByCitizenId)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {getEmployeeName(order.orderMakerEmpId)}
              </td>
              <td className="pl-10 py-4 text-sm text-gray-900">
                {order.orderItems.length}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {order.orderPrice !== undefined &&
                order.orderPrice !== null &&
                !isNaN(Number(order.orderPrice))
                  ? Number(order.orderPrice).toFixed(2)
                  : "-"}
              </td>
              <td className="pl-6 py-4 text-sm text-gray-900">
                <span
                  className={`font-bold px-2 py-1 rounded text-white text-sm ${
                    order.orderStatus ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {order.orderStatus ? "Paid" : "In-Progress"}
                </span>
              </td>
              {order.orderStatus == true ? (
                <td className="px-4 text-sm text-gray-900">
                  <button
                    className="px-4 py-2 text-sm text-gray-500 rounded-md text-right flex items-center justify-center gap-1 mt-1 cursor-not-allowed"
                    disabled
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </td>
              ) : (
                <td className="px-4 text-sm text-gray-900 flex">
                  <button
                    className="px-4 py-2 text-sm text-gray-900 hover:text-red-700 hover:bg-red-100 rounded-md text-right flex items-center justify-center gap-1 mt-1"
                    onClick={() => handleDelete(order.orderId)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
