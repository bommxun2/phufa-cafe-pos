"use client";

import axios from "axios";
import { useEffect, useState, useRef } from "react";

interface CustomerDetailProps {
  selectedCustomer: any;
  setSelectedCustomer: (customer: any) => void;
  setCustomers: (customer: any) => void;
}

export default function CustomerDetail({
  selectedCustomer,
  setSelectedCustomer,
  setCustomers,
}: CustomerDetailProps) {
  const [error, seError] = useState("");
  const basePointRef = useRef<number>(selectedCustomer.point);

  useEffect(() => {
    basePointRef.current = selectedCustomer.point;
  }, [selectedCustomer.citizenId]);

  const saveCustomer = async () => {
    try {
      let updatedCustomer = selectedCustomer;

      if (selectedCustomer.newCustomer == true) {
        await axios.post(`/api/customers`, selectedCustomer);
        await axios.post(
          `/api/customers/${selectedCustomer.citizenId}/points`,
          {
            pointsToAdd: selectedCustomer.point,
          }
        );
      } else {
        await axios.put(
          `/api/customers/${selectedCustomer.citizenId}`,
          selectedCustomer
        );
        if (basePointRef.current !== selectedCustomer.point) {
          await axios.post(
            `/api/customers/${selectedCustomer.citizenId}/points`,
            {
              pointsToAdd: selectedCustomer.point - basePointRef.current,
            }
          );
        }
      }

      setCustomers((prev) => {
        const exists = prev.some(
          (c) => c.citizenId === selectedCustomer.citizenId
        );

        if (exists) {
          return prev.map((c) =>
            c.citizenId === selectedCustomer.citizenId ? updatedCustomer : c
          );
        } else {
          return [...prev, { ...updatedCustomer, newCustomer: false }];
        }
      });

      seError("Save customer success");
    } catch (error) {
      seError("Error save customer");
    }
  };

  useEffect(() => {
    seError("");
  }, [selectedCustomer]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Customer</h2>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* CitizenId (ReadOnly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CitizenId
          </label>
          {selectedCustomer.newCustomer == true ? (
            <input
              type="text"
              value={selectedCustomer.citizenId}
              onChange={(e) =>
                setSelectedCustomer({
                  ...selectedCustomer,
                  citizenId: e.target.value,
                })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
            />
          ) : (
            <input
              type="text"
              value={selectedCustomer.citizenId}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg sm:text-sm cursor-not-allowed"
            />
          )}
        </div>

        {/* Name (Split firstname & lastname separately) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Firstname
          </label>
          <input
            type="text"
            value={selectedCustomer.firstname}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                firstname: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Lastname
          </label>
          <input
            type="text"
            value={selectedCustomer.lastname}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                lastname: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            value={selectedCustomer.gender}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                gender: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          >
            <option value="">Choose gender</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>

        {/* PhoneNumber */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            PhoneNumber
          </label>
          <input
            type="text"
            value={selectedCustomer.phoneNum}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                phoneNum: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            value={selectedCustomer.address}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                address: e.target.value,
              })
            }
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm resize-none"
          />
        </div>

        {/* Point */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Point
          </label>
          <input
            type="number"
            value={selectedCustomer.point}
            onChange={(e) =>
              setSelectedCustomer({
                ...selectedCustomer,
                point: parseInt(e.target.value) || 0,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {error === "" ? (
        <button
          className="mt-6 w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={saveCustomer}
        >
          Save
        </button>
      ) : error === "Save customer success" ? (
        <>
          <span className="text-green-600 text-base block font-bold my-2">
            {error}
          </span>
          <button
            className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={saveCustomer}
          >
            Save
          </button>
        </>
      ) : (
        <>
          <span className="text-red-600 text-base block font-bold my-2">
            {error}
          </span>
          <button
            className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={saveCustomer}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
