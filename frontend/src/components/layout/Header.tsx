// src/components/layout/Header.tsx
"use client";

import { useRouter, usePathname } from "next/navigation"; // Combined imports
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL, API_PUBLIC_URL } from "@/lib/apiConfig"; // For image URL construction
// import { useAuth } from "@/contexts/AuthContext"; // Potential future integration

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  // const { user, logout: authLogout } = useAuth(); // Potential future integration

  // State for employee details from localStorage
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  // const [token, setToken] = useState<string | null>(null); // 'token' from localStorage - not directly used in UI
  const [employeeImageUrl, setEmployeeImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // If using AuthContext:
    // if (user) {
    //   setEmployeeName(user.displayName);
    //   setEmployeeRole(user.role);
    //   setEmployeeId(user.username); // Assuming user.username is empId
    //   if (user.profileUrl) {
    //      setEmployeeImageUrl(user.profileUrl.startsWith('http') ? user.profileUrl : `${API_PUBLIC_URL}${user.profileUrl}`);
    //   } else {
    //      setEmployeeImageUrl(null);
    //   }
    // } else {
      // Fallback to localStorage if AuthContext is not fully integrated or user is null
      const storedEmpId = localStorage.getItem("employeeId");
      setEmployeeId(storedEmpId);
      setEmployeeName(localStorage.getItem("employeeName"));
      setEmployeeRole(localStorage.getItem("employeeRole"));
      // setToken(localStorage.getItem("token")); // Load token if needed elsewhere

      if (storedEmpId) {
        fetchEmployeeImage(storedEmpId);
      } else {
        setEmployeeImageUrl(null); // No employee ID, no image
      }
    // }
  // }, [user]); // Dependency on 'user' if using AuthContext
  }, []); // Runs once on mount to load from localStorage


  const fetchEmployeeImage = async (empId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${empId}`); // Use API_BASE_URL
      if (response.ok) {
        const data = await response.json();
        if (data.profileUrl) {
          // Construct full URL if profileUrl is relative
          const fullUrl = data.profileUrl.startsWith('http') || data.profileUrl.startsWith('/')
            ? data.profileUrl
            : `/${data.profileUrl}`; // Assuming it's relative from root if not starting with /
          
          // If API_PUBLIC_URL is configured and profileUrl is relative
          if (API_PUBLIC_URL && fullUrl.startsWith('/')) {
             setEmployeeImageUrl(`${API_PUBLIC_URL}${fullUrl}`);
          } else if (fullUrl.startsWith('/')) { // Relative to current domain
             setEmployeeImageUrl(fullUrl);
          }
          else { // Assume it's already a full URL or needs no prefix
            setEmployeeImageUrl(data.profileUrl);
          }
        } else {
          setEmployeeImageUrl(null);
        }
      } else {
        console.error("Failed to fetch employee image, status:", response.status);
        setEmployeeImageUrl(null); // Set to null on error
      }
    } catch (error) {
      console.error("Error fetching employee image:", error);
      setEmployeeImageUrl(null); // Set to null on error
    }
  };

  // This useEffect specifically fetches the image when employeeId is available and changes.
  // The previous useEffect sets employeeId from localStorage.
  // This one was commented out in the original refactoring, but is needed if fetchEmployeeImage is separate.
  // However, it's better to call fetchEmployeeImage directly after setting employeeId.
  // For simplicity and to match the likely intent, I've moved fetchEmployeeImage call into the first useEffect.


  const handleLogout = () => {
    // if (authLogout) { // If using AuthContext
    //   authLogout();
    // } else {
      // Manual localStorage clearing
      localStorage.removeItem("employeeId");
      localStorage.removeItem("employeeName");
      localStorage.removeItem("employeeRole");
      localStorage.removeItem("token");
      // Clear local state as well
      setEmployeeId(null);
      setEmployeeName(null);
      setEmployeeRole(null);
      setEmployeeImageUrl(null);
      router.replace("/"); // Use replace to prevent going back to authenticated pages
    // }
  };

  // Define navigation items. Could be moved to a config file if it grows.
  // Access control for links can be added here based on employeeRole.
  const navigation = [
    { name: "POS", href: "/pos", roles: ["แคชเชียร์", "ผู้จัดการ"] }, // Example roles
    { name: "Dashboard (Menu)", href: "/dashboard", roles: ["ผู้จัดการ"] },
    { name: "Customers", href: "/customer", roles: ["ผู้จัดการ", "แคชเชียร์"] },
    { name: "Orders", href: "/orders", roles: ["ผู้จัดการ", "แคชเชียร์"] },
    { name: "Ingredients", href: "/ingredients", roles: ["ผู้จัดการ"] },
    { name: "Employees", href: "/employees", roles: ["ผู้จัดการ"] }, // Only admin can see employees list
  ];

  const availableNavLinks = navigation.filter(item =>
    !employeeRole || item.roles.includes(employeeRole.toLowerCase()) // Check role (case-insensitive)
  );


  return (
    <header className="bg-white shadow-sm print:hidden"> {/* Hide header on print */}
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-x-4 md:gap-x-6">
          {/* Optional: Company Logo */}
          {/* <Link href="/dashboard">
            <span className="text-xl font-semibold text-primary">Phufa Café</span>
          </Link> */}
          <nav className="flex items-center gap-x-2 md:gap-x-3">
            {availableNavLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-dark
                  ${
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) || (item.href === "/dashboard" && pathname === "/dashboard")
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {employeeId && ( // Only show user info and logout if logged in
          <div className="flex items-center gap-x-2 md:gap-x-3">
            <div className="text-right">
              <span className="text-xs sm:text-sm font-medium text-gray-800 block truncate max-w-[100px] sm:max-w-[150px]" title={employeeName || ""}>{employeeName || "User"}</span>
              <span className="text-xs text-gray-500 block capitalize">{employeeRole || "Role"}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full overflow-hidden ring-1 ring-gray-300">
              {employeeImageUrl ? (
                <img
                  src={employeeImageUrl}
                  alt={employeeName || "Profile"}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} // Fallback avatar
                />
              ) : (
                 // Placeholder SVG or default image
                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 md:ml-3 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}