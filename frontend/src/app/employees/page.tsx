// src/app/employees/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import EmployeeDetail from "@/components/employee/EmployeeDetail";
import { employeeApi } from "@/services/employeeApi";
import type { EmployeeFromAPI } from "@/types/employee";
import { API_PUBLIC_URL } from "@/lib/apiConfig"; // For image display
import { useToast } from "@/contexts/ToastContext";

export default function EmployeesPage() {
  const { addToast } = useToast();
  const [allEmployees, setAllEmployees] = useState<EmployeeFromAPI[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeFromAPI | 'NEW' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(() => {
    setIsLoading(true);
    employeeApi.getAll()
      .then(data => {
        setAllEmployees(data);
      })
      .catch(error => {
        console.error("Error fetching employees:", error);
        addToast(error.message || "Failed to fetch employees.", "error");
        setAllEmployees([]); // Clear on error
      })
      .finally(() => setIsLoading(false));
  }, [addToast]); // addToast as dependency

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddNewEmployeeClick = () => {
    setActiveEmployee('NEW');
  };

  const handleSelectEmployee = (employee: EmployeeFromAPI) => {
    setActiveEmployee(employee);
  };

  const handleSaveSuccess = (savedEmployee: EmployeeFromAPI, mode: 'create' | 'update') => {
    if (mode === 'create') {
      setAllEmployees(prev => [...prev, savedEmployee]);
    } else {
      setAllEmployees(prev =>
        prev.map(emp => (emp.empId === savedEmployee.empId ? savedEmployee : emp))
      );
    }
    // If the savedEmployee is the currently active one, update activeEmployee to ensure its data is fresh
    if (typeof activeEmployee === 'object' && activeEmployee?.empId === savedEmployee.empId) {
      setActiveEmployee(savedEmployee);
    } else if (mode === 'create') {
       // After creating, activeEmployee was 'NEW'. We can either close or select the new one.
       // setActiveEmployee(savedEmployee); // Option: select the newly created employee
       setActiveEmployee(null); // Option: close detail panel
    } else {
       setActiveEmployee(null); // Close detail panel if a different employee was updated
    }
    // Toast is shown by EmployeeDetail
  };

  const handleDeleteSuccess = (deletedEmpId: string) => {
    setAllEmployees(prev => prev.filter(emp => emp.empId !== deletedEmpId));
    setActiveEmployee(null); // Close detail panel
    // Toast is shown by EmployeeDetail
  };

  const handleCancelDetail = () => {
    setActiveEmployee(null);
  };

  const constructFullImageUrl = (relativeUrl: string | undefined | null): string | null => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return API_PUBLIC_URL ? `${API_PUBLIC_URL}${path}` : path;
  };


  if (isLoading && allEmployees.length === 0) {
    return (
      <div className="min-h-screen bg-sage-100 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-6">
          <p className="text-center text-gray-500 py-10">Loading employees...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-800">Employees</h1>
              <button
                onClick={handleAddNewEmployeeClick}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
              >
                + Add New
              </button>
            </div>
            {allEmployees.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                No employees found. Click "Add New" to create one.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allEmployees.map(employee => (
                        <tr
                          key={employee.empId}
                          onClick={() => handleSelectEmployee(employee)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full overflow-hidden ring-1 ring-gray-300">
                              {employee.profileUrl ? (
                                <img src={constructFullImageUrl(employee.profileUrl) || '/default-avatar.png'} alt={`${employee.firstname}'s profile`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}/>
                              ) : (
                                <svg className="w-full h-full text-gray-400 p-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{employee.empId}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{employee.firstname} {employee.lastname}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.empRole}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.phoneNum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {activeEmployee !== null && (
            <div className="w-full lg:w-[400px] xl:w-[450px] lg:sticky lg:top-[calc(var(--header-height,68px)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height,68px)-3rem)] mt-6 lg:mt-0">
              <EmployeeDetail
                key={typeof activeEmployee === 'string' ? 'new-employee-form' : activeEmployee.empId}
                employee={typeof activeEmployee === 'object' ? activeEmployee : undefined}
                onSaveSuccess={handleSaveSuccess}
                onDeleteSuccess={handleDeleteSuccess}
                onCancel={handleCancelDetail}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}