import { useEffect, useState } from 'react';

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
}

export default function OrderList({ onSelectOrder, selectedDate, orders, customers, employees }: OrderListProps) {
  function getCustomerName(citizenId: string) {
    const c = customers.find((c: any) => c.citizenId === citizenId);
    return c ? `${c.firstname} ${c.lastname}` : '-';
  }
  function getEmployeeName(empId: string) {
    const e = employees.find((e: any) => e.empId === empId);
    return e ? `${e.firstname} ${e.lastname}` : '-';
  }

  function formatDateTime(dateString: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${datePart} ${timePart}`;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">OrderID</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">DateTime</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Customer</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Menu#</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Total</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr
              key={order.orderId}
              onClick={() => onSelectOrder(order)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">{order.orderId}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(order.orderDateTime)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{getCustomerName(order.orderByCitizenId)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{getEmployeeName(order.orderMakerEmpId)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">-</td>
              <td className="px-6 py-4 text-sm text-gray-900">{
                order.orderPrice !== undefined && order.orderPrice !== null && !isNaN(Number(order.orderPrice))
                  ? Number(order.orderPrice).toFixed(2)
                  : '-'
              }</td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <span
                  className={`px-2 py-1 rounded text-white text-sm ${order.orderStatus ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {order.orderStatus ? 'Paid' : 'In-Progress'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}