// src/types/employee.ts (หรือที่เดียวกับ Ingredient types)

export type PersonBase = {
  citizenId: string;
  firstname: string;
  lastname: string;
  gender: string; // M/F/O
  phoneNum: string;
  address?: string; // Optional in base, but maybe required in form
  profileUrl?: string;
};

// Employee data from API (GET /employees/{empId}, response of POST/PUT)
export type EmployeeFromAPI = PersonBase & {
  empId: string;
  empRole: string;
  empSalary: number;
  // API response for GET /employees typically doesn't include password
};

// Payload for creating an Employee (POST /employees)
export type EmployeeCreatePayload = PersonBase & {
  empId: string; // Required for creation as per spec
  empRole: string;
  empSalary: number;
  password?: string; // Optional, backend might require it or auto-generate
};

// Payload for updating an Employee (PUT /employees/{empId})
// Only include fields that can be updated. empId & citizenId usually not updatable.
export type EmployeeUpdatePayload = {
  firstname?: string;
  lastname?: string;
  gender?: string;
  phoneNum?: string;
  address?: string;
  profileUrl?: string;
  empRole?: string;
  empSalary?: number;
  // password might be handled by a separate endpoint/flow
};

// Data structure for the Employee form
export type EmployeeFormData = PersonBase & {
  empId: string; // Editable on create, read-only on edit
  empRole: string;
  empSalary: number | string; // Use string for input, parse to number on save
  password?: string; // For create form
  confirmPassword?: string; // For create form, client-side validation
};
