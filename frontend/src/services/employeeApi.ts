// src/services/employeeApi.ts
import { EmployeeFromAPI, EmployeeCreatePayload, EmployeeUpdatePayload } from '@/types/employee'; // Adjust path

const API_BASE_URL = "/api";

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

interface FileUploadResponse {
  message: string;
  fileUrl: string; // Relative URL path
}

export const employeeApi = {
  getAll: async (): Promise<EmployeeFromAPI[]> => {
    const response = await fetch(`${API_BASE_URL}/employees`);
    return handleApiResponse<EmployeeFromAPI[]>(response);
  },

  getById: async (empId: string): Promise<EmployeeFromAPI> => {
    const response = await fetch(`${API_BASE_URL}/employees/${empId}`);
    return handleApiResponse<EmployeeFromAPI>(response);
  },

  create: async (payload: EmployeeCreatePayload): Promise<EmployeeFromAPI> => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<EmployeeFromAPI>(response);
  },

  update: async (empId: string, payload: EmployeeUpdatePayload): Promise<EmployeeFromAPI> => {
    const response = await fetch(`${API_BASE_URL}/employees/${empId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<EmployeeFromAPI>(response);
  },

  delete: async (empId: string): Promise<null> => {
    const response = await fetch(`${API_BASE_URL}/employees/${empId}`, {
      method: 'DELETE',
    });
    return handleApiResponse<null>(response);
  },

  // New function to upload profile image
  uploadProfileImage: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('profileImage', file); // 'profileImage' must match the key expected by your API

    const response = await fetch(`${API_BASE_URL}/uploads/profile-image`, {
      method: 'POST',
      body: formData,
      // Headers are set automatically by browser for FormData with files
    });
    return handleApiResponse<FileUploadResponse>(response);
  }
};