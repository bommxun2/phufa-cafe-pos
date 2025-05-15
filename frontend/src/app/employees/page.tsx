// src/app/employees/page.tsx
"use client";

import { useEffect, useState } from "react"; // Removed useMemo as it's not strictly needed here with direct state update
import Header from "@/components/layout/Header";
import EmployeeDetail from "@/components/employee/EmployeeDetail";
import { employeeApi } from "@/services/employeeApi";
import { EmployeeFromAPI } from "@/types/employee"; // FormData type not needed here
// import { useToast } from "@/contexts/ToastContext";

// Define your public API URL here or import it from your config

export default function EmployeesPage() {
  const [allEmployees, setAllEmployees] = useState<EmployeeFromAPI[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeFromAPI | null | 'NEW'>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { addToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    employeeApi.getAll()
      .then(data => {
        setAllEmployees(data);
      })
      .catch(error => {
        console.error("Error fetching employees:", error);
        // addToast(error.message || "Failed to fetch employees.", "error");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddNewEmployeeClick = () => {
    setActiveEmployee('NEW');
  };

  const handleSelectEmployee = (employee: EmployeeFromAPI) => {
    setActiveEmployee(employee); // Pass the EmployeeFromAPI object directly
  };

  const handleSaveSuccess = (savedEmployee: EmployeeFromAPI, mode: 'create' | 'update') => {
    if (mode === 'create') {
      setAllEmployees(prev => [...prev, savedEmployee]);
    } else {
      setAllEmployees(prev =>
        prev.map(emp => (emp.empId === savedEmployee.empId ? savedEmployee : emp))
      );
    }
    setActiveEmployee(null);
  };

  const handleDeleteSuccess = (deletedEmpId: string) => {
    setAllEmployees(prev => prev.filter(emp => emp.empId !== deletedEmpId));
    setActiveEmployee(null);
  };

  const handleCancelDetail = () => {
    setActiveEmployee(null);
  };

  if (isLoading && allEmployees.length === 0) {
    return (
      <div className="min-h-screen bg-sage-100">
        <Header />
        <main className="container mx-auto p-6"><p>Loading employees...</p></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-medium">Employees</h1>
              <button
                onClick={handleAddNewEmployeeClick}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Add New Employee
              </button>
            </div>
            {allEmployees.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                No employees found.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        {/* Add more columns as needed, e.g., Profile Pic Thumbnail */}
                      </tr>
                    </thead>
                    <tbody>
                      {allEmployees.map(employee => (
                        <tr
                          key={employee.empId}
                          onClick={() => handleSelectEmployee(employee)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.empId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* Optional: Display small thumbnail if you have one */}
                            {employee.profileUrl && (
                                <img src={`${employee.profileUrl}`} alt="" width={24} height={24} className="inline-block rounded-full mr-2 w-6 h-6 object-cover" />
                            )}
                            {employee.firstname} {employee.lastname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.empRole}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.phoneNum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {activeEmployee !== null && (
            <div className="w-full lg:w-[450px] lg:sticky lg:top-6 self-start">
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