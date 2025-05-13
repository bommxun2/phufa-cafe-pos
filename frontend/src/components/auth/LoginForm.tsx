"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ empId: employeeId, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      // Assuming the API returns a token or user data
      localStorage.setItem("employeeId", data.employee.empId);
      localStorage.setItem("employeeName", data.employee.name);
      localStorage.setItem("employeeRole", data.employee.role);
      localStorage.setItem("token", data.accessToken); // Store token if needed

      router.push("/dashboard"); // Redirect to dashboard on successful login
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-medium text-center mb-8">
        Phufa Cafe Login
      </h1>

      <div className="space-y-2">
        <label htmlFor="employeeId" className="block text-sm font-medium">
          Employee ID*
        </label>
        <input
          id="employeeId"
          type="text"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password*
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
      >
        Login
      </button>
    </form>
  );
}
