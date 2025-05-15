"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [EmployeeName, setEmployeeName] = useState<string | null>(null);
  const [EmployeeRole, setEmployeeRole] = useState<string | null>(null);
  const [EmployeeId, setEmployeeId] = useState<string | null>(null);
  const [Token, setToken] = useState<string | null>(null);
  const [EmployeeImage, setEmployeeImage] = useState<string | null>(null);

  useEffect(() => {
    setEmployeeName(localStorage.getItem("employeeName"));
    setEmployeeRole(localStorage.getItem("employeeRole"));
    setEmployeeId(localStorage.getItem("employeeId"));
    setToken(localStorage.getItem("token"));

    const fetchEmployeeImage = async () => {
      const response = await fetch(`/api/employees/${EmployeeId}`);
      if (response.ok) {
        const imageUrl = await response.json();
        console.log(imageUrl);
        setEmployeeImage(imageUrl.profileUrl);
      } else {
        console.error("Failed to fetch employee image");
      }
    };
    if (EmployeeId) {
      fetchEmployeeImage();
    }
  }, [EmployeeId]);

  const logout = () => {
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeName");
    localStorage.removeItem("employeeRole");
    localStorage.removeItem("token");
    router.replace("/");
  };

  const navigation = [
    { name: "POS", href: "/pos" },
    { name: "Menu", href: "/dashboard" },
    { name: "Orders", href: "/orders" },
    { name: "Ingredients", href: "/ingredients" },
    { name: "Employees", href: "/employees" },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="h-6 w-px bg-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{EmployeeName}</span>
          <span className="text-xs text-gray-500">Cashier</span>
          <div className="w-8 h-8 bg-gray-200 rounded-full">
            {EmployeeImage && (
              <img
                src={`${EmployeeImage}`}
                alt=""
                width={32}
                height={32}
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>
          <button onClick={logout} className="ml-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M320 32c0-9.9-4.5-19.2-12.3-25.2S289.8-1.4 280.2 1l-179.9 45C79 51.3 64 70.5 64 92.5L64 448l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 192 0 32 0 0-32 0-448zM256 256c0 17.7-10.7 32-24 32s-24-14.3-24-32s10.7-32 24-32s24 14.3 24 32zm96-128l96 0 0 352c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-320c0-35.3-28.7-64-64-64l-96 0 0 64z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
