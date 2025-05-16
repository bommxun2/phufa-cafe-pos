// src/app/customer/page.tsx
"use client";

import CustomerTable from "@/components/customer/CustomerTable";
import CustomerDetail from "@/components/customer/CustomerDetail";
import Header from "@/components/layout/Header";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import type { Customer, CustomerFormData } from "@/types/customer";
import { useToast } from "@/contexts/ToastContext";

export default function CustomerPage() { // Renamed Customer to CustomerPage
  const { addToast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]); // Stores actual Customer data from API
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Customer[]>(`${API_BASE_URL}/customers`);
      // No newCustomer flag needed for the main customers list; that's UI state for the form
      setCustomers(response.data);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      addToast(error.message || "Failed to load customers.", "error");
      setCustomers([]); // Set to empty on error
    } finally {
      setIsLoading(false);
    }
  }, [addToast]); // addToast as dependency

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddNewCustomer = useCallback(() => {
    setSelectedCustomer({
      citizenId: "",
      firstname: "",
      lastname: "",
      gender: "", // Default to empty or a common value like "M"
      phoneNum: "",
      point: 0, // New customers start with 0 points unless set in form
      address: "",
      // profileUrl: "", // If you have profile pictures for customers
      newCustomer: true, // Flag for CustomerDetail to know it's a new entry
    });
  }, []);

  // This function will be passed to CustomerDetail, which might update the selectedCustomer state directly
  // or call this to update the list after a save.
  // For now, CustomerDetail updates its own copy and then calls setCustomers to update the list.

  return (
    <div className="min-h-screen bg-sage-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-800">Customer Management</h1>
              <button
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                onClick={handleAddNewCustomer}
              >
                + Add New Customer
              </button>
            </div>
            {isLoading ? (
                <p className="text-center py-10">Loading customers...</p>
            ) : (
                <CustomerTable
                    setSelectedCustomer={ (customer: Customer) => setSelectedCustomer({...customer, newCustomer: false}) } // When selecting from table, it's an existing customer
                    customers={customers}
                />
            )}
          </div>
          <div className="w-full lg:w-[400px] xl:w-[450px] lg:sticky lg:top-[calc(var(--header-height,68px)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height,68px)-3rem)] mt-6 lg:mt-0">
            {selectedCustomer ? (
              <CustomerDetail
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer} // Allow detail to modify its state (e.g., for typing)
                setCustomers={setCustomers} // Allow detail to update the main list after save/create
              />
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 py-10">Select a customer to view or edit, or add a new one.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}