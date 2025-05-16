// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { API_BASE_URL } from "@/lib/apiConfig";
// import { useAuth } from "@/contexts/AuthContext"; // For future integration

export default function LoginForm() {
  const { addToast } = useToast();
  // const auth = useAuth(); // For future integration
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Option 1: Current direct fetch
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: employeeId, password }),
      });

      const data = await response.json(); // Attempt to parse JSON regardless of response.ok for error messages

      if (!response.ok) {
        // Use message from API response if available, otherwise a generic one
        throw new Error(data.message || `Login failed. Status: ${response.status}`);
      }

      // Assuming API returns: { accessToken, tokenType, employee: { empId, firstname, lastname, empRole, profileUrl } }
      // Based on OpenAPI spec, it's { accessToken, tokenType }. Employee details might need separate fetch or be included.
      // For this example, let's assume employee details are part of the login response for simplicity in setting localStorage
      // If not, they should be fetched after login or AuthContext should handle this.
      
      // The OpenAPI spec for /auth/login only returns accessToken and tokenType.
      // The `localStorage` items being set here (employeeName, employeeRole) imply
      // that the actual API response for `/auth/login` might be richer or these are
      // fetched subsequently.
      // For now, we'll assume the provided structure from the original component's expectation:
      // data.employee.empId, data.employee.name, data.employee.role

      // The OpenAPI for /auth/login shows it returns { accessToken, tokenType }.
      // To get employee details, another call or a modified login response is needed.
      // Here, we'll try to match the localStorage items from the original login form.
      // This part needs alignment with the actual /api/auth/login response.
      // For demonstration, let's assume a more detailed response like:
      // { accessToken: "...", tokenType: "Bearer", employee: { empId: "...", name: "...", role: "..."} }
      // If this isn't the case, `employeeName` and `employeeRole` would be problematic here.

      if (data.accessToken && data.employee) { // Check if expected data is present
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("employeeId", data.employee.empId); // from response
        localStorage.setItem("employeeName", data.employee.name); // from response
        localStorage.setItem("employeeRole", data.employee.role); // from response

        addToast("Login successful!", "success");
        router.push("/dashboard");
      } else {
         // If the API response structure is just token, this part would fail or need adjustment.
        console.error("Login response did not contain expected employee details or token.", data);
        throw new Error("Login successful, but user data is incomplete in response.");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      addToast(error.message || "Login failed. Please check your credentials.", "error");
    } finally {
      setIsLoading(false);
    }

    // Option 2: Using AuthContext (Preferred for consistency)
    // if (auth) {
    //   try {
    //     const success = await auth.login(employeeId, password); // AuthContext's login would handle API call + localStorage
    //     if (success) {
    //       addToast("Login successful!", "success");
    //       router.push("/dashboard");
    //     } else {
    //       addToast("Invalid Employee ID or Password.", "error"); // AuthContext login should throw or return specific error messages
    //     }
    //   } catch (err: any) {
    //     addToast(err.message || "An error occurred during login.", "error");
    //   } finally {
    //     setIsLoading(false);
    //   }
    // } else {
    //   addToast("Auth system not available.", "error"); // Fallback if AuthContext is not loaded
    //   setIsLoading(false);
    // }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8">
        Phufa Cafe Login
      </h1>

      {/* Error messages are now handled by toast notifications */}

      <div className="space-y-1.5">
        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
          Employee ID*
        </label>
        <input
          id="employeeId"
          type="text"
          required
          autoComplete="username"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-dark shadow-sm sm:text-sm"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password*
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-dark shadow-sm sm:text-sm"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 transition-colors disabled:opacity-70"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}