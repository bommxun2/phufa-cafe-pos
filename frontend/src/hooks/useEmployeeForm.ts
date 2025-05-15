// src/hooks/useEmployeeForm.ts
import { useState, useEffect, useCallback } from 'react';
import { EmployeeFormData, EmployeeFromAPI } from '@/types/employee'; // Adjust path

const defaultNewEmployeeValues: EmployeeFormData = {
  empId: "",
  citizenId: "",
  firstname: "",
  lastname: "",
  gender: "M",
  phoneNum: "",
  address: "",
  profileUrl: "", // This will hold the URL string
  empRole: "",
  empSalary: "", 
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
        ...initialData,
        empSalary: String(initialData.empSalary), 
        profileUrl: initialData.profileUrl || "", // Ensure profileUrl is initialized
        password: "", 
        confirmPassword: "",
      };
    }
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
      [name]: value,
    }));
  };

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  return {
    formData,
    setFormData, // Expose setFormData if needed for direct profileUrl update after upload
    handleInputChange,
    resetForm,
  };
}