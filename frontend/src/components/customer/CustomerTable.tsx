// src/components/customer/CustomerTable.tsx
"use client";

import type { Customer } from "@/types/customer"; // Use centralized type

interface CustomerTableProps {
  setSelectedCustomer: (customer: Customer) => void;
  customers: Customer[];
}

export default function CustomerTable({
  setSelectedCustomer,
  customers,
}: CustomerTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        No customers found. Click "Add New Customer" to begin.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto"> {/* For responsiveness */}
        <table className="w-full min-w-[800px]"> {/* Min width for better layout */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citizen ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => ( // customer is now typed as Customer
              <tr
                key={customer.citizenId}
                onClick={() => setSelectedCustomer(customer)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.citizenId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.firstname} {customer.lastname}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {customer.gender === "M" ? "Male" : customer.gender === "F" ? "Female" : customer.gender === "O" ? "Other" : "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{customer.phoneNum}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{customer.point}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={customer.address}>
                  {customer.address || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}