// src/hooks/useEmployeeForm.ts
import { useState, useEffect, useCallback } from 'react';
import { EmployeeFormData, EmployeeFromAPI } from '@/types/employee';

const defaultNewEmployeeValues: EmployeeFormData = {
  empId: "",
  citizenId: "",
  firstname: "",
  lastname: "",
  gender: "M", // Default gender
  phoneNum: "",
  address: "",
  profileUrl: "",
  empRole: "",
  empSalary: "", // string for form input
  password: "",
  confirmPassword: "",
};

interface UseEmployeeFormProps {
  initialData?: EmployeeFromAPI;
  isCreating: boolean;
}

export function useEmployeeForm({ initialData, isCreating }: UseEmployeeFormProps) {
  const getInitialFormData = useCallback((): EmployeeFormData => {
    if (isCreating) {
      return { ...defaultNewEmployeeValues };
    }
    if (initialData) {
      return {
        // Spread initialData which conforms to EmployeeFromAPI (subset of PersonBase + Employee specific)
        ...initialData,
        // Override or add fields specific to EmployeeFormData
        empSalary: String(initialData.empSalary), // Convert number to string for form
        profileUrl: initialData.profileUrl || "", // Ensure profileUrl is initialized
        password: "", // Clear password fields for edit form
        confirmPassword: "",
      };
    }
    // Fallback if initialData is somehow not provided in edit mode (should not happen ideally)
    return { ...defaultNewEmployeeValues };
  }, [initialData, isCreating]);

  const [formData, setFormData] = useState<EmployeeFormData>(getInitialFormData);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Value from form inputs is typically string
    }));
  };

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  return {
    formData,
    setFormData,
    handleInputChange,
    resetForm,
  };
}