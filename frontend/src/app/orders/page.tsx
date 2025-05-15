"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import OrderList, { type Order } from "@/components/order/OrderList";
import OrderDetail from "@/components/order/OrderDetailFromOrder";

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [summary, setSummary] = useState<{
    totalIncome: number;
    orderCount: number;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  // Helper function to format date for display
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((res) => res.json()),
      fetch("/api/customers").then((res) => res.json()),
      fetch("/api/employees").then((res) => res.json()),
    ])
      .then(([ordersData, customersData, employeesData]) => {
        const empId = localStorage.getItem("employeeId");

        const filtered = ordersData.filter((order: any) => {
          const orderDate = order.orderDateTime?.slice(0, 10);
          return orderDate === selectedDate && empId == order.orderMakerEmpId;
        });

        const sortedOrders = filtered.sort((a, b) => {
          if (a.orderStatus !== b.orderStatus) {
            return a.orderStatus ? 1 : -1;
          }

          const numA = parseInt(a.orderId.replace(/\D/g, ""), 10);
          const numB = parseInt(b.orderId.replace(/\D/g, ""), 10);
          return numA - numB;
        });

        setOrders(sortedOrders);
        setCustomers(customersData);
        setEmployees(employeesData);
      })
      .catch(() => {});
    fetch(`/api/reports/daily-income?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) =>
        setSummary({
          totalIncome: data.totalIncome,
          orderCount: data.orderCount,
        })
      )
      .catch(() => setSummary(null));
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-medium">
                  {formatDate(selectedDate)}
                </h1>
                <input
                  type="date"
                  className="border rounded-md px-2 py-1 ml-4"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <div className="flex items-center gap-4 ml-8">
                  <div className="bg-primary text-white px-6 py-2 rounded-lg font-bold">
                    <div className="text-sm mb-1 text-xl">Sales</div>
                    <div className="text-xl font-medium">
                      {summary
                        ? summary.totalIncome.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : "-"}
                    </div>
                  </div>
                  <div className="bg-[#003D5B] text-white px-6 py-2 rounded-lg font-bold">
                    <div className="text-sm mb-1 text-xl">Orders</div>
                    <div className="text-xl font-medium">
                      {summary ? summary.orderCount : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <OrderList
              onSelectOrder={setSelectedOrder}
              selectedDate={selectedDate}
              orders={orders}
              customers={customers}
              employees={employees}
              setOrders={setOrders}
              setSummary={setSummary}
            />
          </div>
          <div className="w-[400px]">
            <OrderDetail order={selectedOrder} orders={orders} setOrders={setOrders}/>
          </div>
        </div>
      </main>
    </div>
  );
}
