// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react"; // Added React import
import { useRouter } from "next/navigation";

// If this User type becomes more complex or is used elsewhere (e.g., closely matches EmployeeFromAPI),
// consider moving it to a shared types file (e.g., src/types/auth.ts or src/types/user.ts).
interface User {
  username: string; // Corresponds to empId in other parts of the app
  role: string;
  displayName: string;
  // Potentially add other relevant user details from your actual user/employee model
  // empId?: string;
  // profileUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>; // username is empId
  logout: () => void;
  // isLoading: boolean; // Optional: to indicate login process
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // const [isLoading, setIsLoading] = useState(true); // To handle initial auth check
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    // setIsLoading(true); // Start loading
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // TODO: Potentially re-validate token with backend here if it exists
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user"); // Clear corrupted data
      }
    }
    // setIsLoading(false); // Done loading
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    // This is a MOCK login. In a real app, you would:
    // 1. Call your actual API's login endpoint (e.g., /api/auth/login)
    //    const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ empId: username, password }) });
    //    if (!response.ok) return false;
    //    const apiLoginData = await response.json(); // { accessToken, employee: { empId, name, role } } (based on auth/LoginForm)
    // 2. Store the token (e.g., apiLoginData.accessToken) securely (localStorage or httpOnly cookie).
    // 3. Fetch full user details if not returned by login, or use what's returned.
    // 4. Set the user state.

    // Mock implementation:
    if (username === "admin" && password === "admin") {
      // Example user
      const loggedInUser: User = {
        username: "admin", // This should be the empId
        role: "admin",
        displayName: "Admin User",
        // In a real scenario, map actual employee data here
        // empId: apiLoginData.employee.empId,
        // displayName: apiLoginData.employee.name,
        // role: apiLoginData.employee.role,
        // profileUrl: apiLoginData.employee.profileUrl,
      };
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      // Also store employeeId, employeeName, employeeRole, token in localStorage
      // to match what other parts of the app expect (e.g., Header.tsx, POS page)
      localStorage.setItem("employeeId", loggedInUser.username); // Assuming username is empId
      localStorage.setItem("employeeName", loggedInUser.displayName);
      localStorage.setItem("employeeRole", loggedInUser.role);
      // localStorage.setItem('token', "mock_token_if_needed_elsewhere");

      return true;
    }
    // Add more mock users or connect to actual login if needed
    // if (username === '6609696969' && password === 'secretpassword') { /* another user */ }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Clear other related localStorage items
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeName");
    localStorage.removeItem("employeeRole");
    localStorage.removeItem("token");
    router.push("/"); // Redirect to login page
  };

  // The value provided to context consumers
  const authContextValue: AuthContextType = {
    user,
    login,
    logout,
    // isLoading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
