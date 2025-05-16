// src/app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import OrderList from "@/components/order/OrderList";
import OrderDetailFromOrder from "@/components/order/OrderDetailFromOrder"; // Renamed OrderDetail to OrderDetailFromOrder
import { API_BASE_URL } from "@/lib/apiConfig";
import type { HistoricalOrder } from "@/types/order";
import type { Customer } from "@/types/customer";
import type { EmployeeFromAPI } from "@/types/employee";
import { useToast } from "@/contexts/ToastContext"; // For error feedback

interface DailySummary {
  totalIncome: number;
  orderCount: number;
}

export default function OrdersPage() { // Renamed Orders to OrdersPage
  const { addToast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<HistoricalOrder | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  const [allOrders, setAllOrders] = useState<HistoricalOrder[]>([]); // Store all fetched orders before filtering
  const [filteredOrders, setFilteredOrders] = useState<HistoricalOrder[]>([]); // Orders to display
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<EmployeeFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to format date for display
  function formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00"); // Ensure date is interpreted in local timezone if only YYYY-MM-DD
    return date.toLocaleDateString("en-GB", { // Or 'th-TH'
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Fetch initial data (all orders for wider range, customers, employees)
  useEffect(() => {
    setIsLoading(true);
    const fetchInitialData = async () => {
      try {
        const [ordersRes, customersRes, employeesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/orders`).then(res => res.json()), // Fetch all orders initially or based on a wider default range
          fetch(`${API_BASE_URL}/customers`).then(res => res.json()),
          fetch(`${API_BASE_URL}/employees`).then(res => res.json()),
        ]);

        if (!Array.isArray(ordersRes)) throw new Error("Orders data is not an array");
        if (!Array.isArray(customersRes)) throw new Error("Customers data is not an array");
        if (!Array.isArray(employeesRes)) throw new Error("Employees data is not an array");

        setAllOrders(ordersRes as HistoricalOrder[]);
        setCustomers(customersRes as Customer[]);
        setEmployees(employeesRes as EmployeeFromAPI[]);

      } catch (error: any) {
        console.error("Error fetching initial data:", error);
        addToast(`Failed to load initial data: ${error.message}`, "error");
        setAllOrders([]);
        setCustomers([]);
        setEmployees([]);
      }
    };

    fetchInitialData(); // Call it here
  }, [addToast]); // addToast dependency

  // Filter and sort orders when allOrders or selectedDate changes
  useEffect(() => {
    const empId = localStorage.getItem("employeeId"); // Role-based filtering might be better done on backend

    const filtered = allOrders.filter((order: HistoricalOrder) => {
      const orderDate = order.orderDateTime?.slice(0, 10); // Extract YYYY-MM-DD from ISO string
      // Filter by date AND by employeeId if it exists (for non-admin roles)
      // Admins/Managers might see all orders for the date.
      // This logic needs to align with business requirements for who sees what.
      // const isUserOrder = !empId || order.orderMakerEmpId === empId; // If empId is null/undefined, show all (adjust as needed)
      const isUserOrder = order.orderMakerEmpId === empId; // Original logic: only show orders by current employee

      return orderDate === selectedDate && isUserOrder;
    });

    const sortedOrders = [...filtered].sort((a, b) => { // Sort a copy
      // Sort by status (In-Progress first), then by OrderID numerically
      if (a.orderStatus !== b.orderStatus) {
        return a.orderStatus ? 1 : -1; // false (In-Progress) comes before true (Paid)
      }
      // Assuming OrderID can be numerically sorted after stripping non-digits, or sort by date as secondary
      const numA = parseInt(String(a.orderId).replace(/\D/g, "") || "0", 10);
      const numB = parseInt(String(b.orderId).replace(/\D/g, "") || "0", 10);
      return new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime(); // Newest first for same status, or numA - numB
    });

    setFilteredOrders(sortedOrders);
    if (selectedOrder && !sortedOrders.find(o => o.orderId === selectedOrder.orderId)) {
      setSelectedOrder(null); // Clear selection if it's no longer in the filtered list
    }
    setIsLoading(false); // Set loading to false after filtering
  }, [allOrders, selectedDate, selectedOrder]); // Added selectedOrder to deps

  // Fetch daily summary when selectedDate changes
  useEffect(() => {
    setSummary(null); // Reset summary while fetching
    const fetchSummary = async () => {
      try {
        // The API endpoint `/reports/daily-income?date=${selectedDate}` should ideally
        // also respect role based access or filter by employeeId if not admin.
        // Currently, it seems to fetch a global summary for the date.
        const summaryRes = await fetch(`${API_BASE_URL}/reports/daily-income?date=${selectedDate}`);
        if (!summaryRes.ok) {
            const errorData = await summaryRes.json().catch(() => null);
            throw new Error(errorData?.message || `Failed to fetch summary. Status: ${summaryRes.status}`);
        }
        const data: DailySummary = await summaryRes.json();
        setSummary(data);
      } catch (error: any) {
        console.error(`Error fetching daily income for ${selectedDate}:`, error);
        addToast(`Failed to load summary: ${error.message}`, "error");
        setSummary(null); // Set to null on error
      }
    };

    if (selectedDate) {
      fetchSummary();
    }
  }, [selectedDate, addToast]); // addToast dependency

  return (
    <div className="min-h-screen bg-sage-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-medium text-gray-800 whitespace-nowrap">
                  {formatDateForDisplay(selectedDate)}
                </h1>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-primary focus:border-primary"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedOrder(null); // Clear selected order when date changes
                  }}
                  max={new Date().toISOString().slice(0, 10)} // Prevent future dates
                />
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-primary text-white px-4 py-2 rounded-lg shadow">
                  <div className="text-xs sm:text-sm opacity-80">Sales</div>
                  <div className="text-md sm:text-lg font-semibold">
                    {summary?.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-"} THB
                  </div>
                </div>
                <div className="bg-sky-700 text-white px-4 py-2 rounded-lg shadow"> {/* Changed color for distinction */}
                  <div className="text-xs sm:text-sm opacity-80">Orders</div>
                  <div className="text-md sm:text-lg font-semibold">
                    {summary?.orderCount?.toLocaleString() ?? "-"}
                  </div>
                </div>
              </div>
            </div>
            {isLoading ? (
                <p className="text-center py-10">Loading orders...</p>
            ) : (
                <OrderList
                    onSelectOrder={setSelectedOrder}
                    // selectedDate={selectedDate} // Not directly used by OrderList for filtering
                    orders={filteredOrders} // Pass filtered orders
                    customers={customers}
                    employees={employees}
                    setOrders={setFilteredOrders} // Allow OrderList to modify the filtered (displayed) list, e.g., on delete
                    setSummary={setSummary} // Allow OrderList to update summary if it performs actions that affect it
                />
            )}
          </div>
          <div className="w-full lg:w-[400px] xl:w-[450px] lg:sticky lg:top-[calc(var(--header-height,68px)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height,68px)-3rem)]">
            <OrderDetailFromOrder
                order={selectedOrder}
                orders={filteredOrders} // Pass filteredOrders to update the correct list
                setOrders={setFilteredOrders} // Allow detail view to update status in the list
            />
          </div>
        </div>
      </main>
    </div>
  );
}