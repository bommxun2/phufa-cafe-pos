"use client";

import CustomerTable from "@/components/customer/CustomerTable";
import CustomerDetail from "@/components/customer/CustomerDetail";
import Header from "@/components/layout/Header";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Customer() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const addNewCustomer = () => {
    setSelectedCustomer({
      citizenId: "",
      firstname: "",
      lastname: "",
      gender: "",
      phoneNum: "",
      point: 0,
      newCustomer: true,
    });
  };

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    async function getCustomerId() {
      const res = await axios.get(`/api/customers`);
      const customerWithFlag = res.data.map((customer: any) => ({
        ...customer,
        newCustomer: false,
      }));
      setCustomers(customerWithFlag);
    }

    getCustomerId();
  }, []);

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-medium">Customer</h1>
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg"
                onClick={addNewCustomer}
              >
                Add New Customer
              </button>
            </div>
            <CustomerTable
              setSelectedCustomer={setSelectedCustomer}
              customers={customers}
            />
          </div>
          <div className="w-[400px]">
            {selectedCustomer && (
              <CustomerDetail
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                setCustomers={setCustomers}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
