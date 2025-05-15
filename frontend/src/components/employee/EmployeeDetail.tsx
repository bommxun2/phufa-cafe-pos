// src/components/employee/EmployeeDetail.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useEmployeeForm } from '@/hooks/useEmployeeForm';
import { employeeApi } from '@/services/employeeApi';
import { EmployeeFormData, EmployeeFromAPI, EmployeeCreatePayload, EmployeeUpdatePayload } from '@/types/employee';
import { useToast } from '@/contexts/ToastContext';

interface EmployeeDetailProps {
  employee?: EmployeeFromAPI;
  onSaveSuccess: (savedEmployee: EmployeeFromAPI, mode: 'create' | 'update') => void;
  onDeleteSuccess?: (empId: string) => void;
  onCancel: () => void;
}

const API_PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || "";


export default function EmployeeDetail({
  employee: initialData,
  onSaveSuccess,
  onDeleteSuccess,
  onCancel,
}: EmployeeDetailProps) {
  const isCreating = !initialData?.empId;
  const [isEditing, setIsEditing] = useState(isCreating);
  const { addToast } = useToast();

  const { formData, setFormData, handleInputChange, resetForm } = useEmployeeForm({
    initialData,
    isCreating,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to initialize or update imagePreview and selectedFile based on initialData
  useEffect(() => {
    if (!isCreating && initialData) {
      setIsEditing(false);
      const currentProfileUrl = initialData.profileUrl;
      setImagePreview(currentProfileUrl ? `${API_PUBLIC_URL}${currentProfileUrl.startsWith('/') ? currentProfileUrl : '/' + currentProfileUrl}` : null);
      setSelectedFile(null); // Clear any previously selected file
    } else { // isCreating
      setIsEditing(true);
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [initialData, isCreating]);

  // Effect to update imagePreview when selectedFile changes or formData.profileUrl changes (e.g., cleared by user)
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (formData.profileUrl) { // Use formData.profileUrl for preview if no file is selected
        setImagePreview(`${API_PUBLIC_URL}${formData.profileUrl.startsWith('/') ? formData.profileUrl : '/' + formData.profileUrl}`);
    }
     else {
      setImagePreview(null);
    }
  }, [selectedFile, formData.profileUrl]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast("File is too large. Max 2MB.", "error");
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        addToast("Invalid file type. Use JPG, PNG, GIF.", "error");
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      // When a new file is selected, we might want to clear the existing profileUrl from formData
      // to ensure the new upload takes precedence, or let handleSave manage this.
      // For now, handleSave will prioritize selectedFile.
    } else {
      setSelectedFile(null);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsDropdownOpen(false);
  };

  const handleCancelEditingClick = () => {
    if (isCreating) {
      onCancel();
    } else {
      resetForm(); // This will reset formData, including profileUrl, to initialData
      setSelectedFile(null);
      // Image preview will be reset by the useEffect watching initialData and formData.profileUrl
      setIsEditing(false);
    }
  };

  const validateFormData = (): boolean => {
    if (!formData.empId?.trim() && isCreating) {
      addToast("Employee ID is required.", "error"); return false;
    }
    if (!formData.citizenId?.trim() || formData.citizenId.length !== 13 || !/^\d+$/.test(formData.citizenId)) {
      addToast("Valid 13-digit Citizen ID is required.", "error"); return false;
    }
    if (!formData.firstname?.trim() || !formData.lastname?.trim()) {
      addToast("First name and Last name are required.", "error"); return false;
    }
    if (!formData.phoneNum?.trim() || !/^\d{10}$/.test(formData.phoneNum)) {
      addToast("Valid 10-digit Phone number is required.", "error"); return false;
    }
    if (!formData.empRole?.trim()) {
      addToast("Employee Role is required.", "error"); return false;
    }
    const salary = parseFloat(String(formData.empSalary));
    if (isNaN(salary) || salary < 0) {
      addToast("Valid non-negative Salary is required.", "error"); return false;
    }
    if (isCreating && !formData.password?.trim()) {
        addToast("Password is required for new employees.", "error"); return false;
    }
    if (isCreating && formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match.", "error"); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);
    // Start with the current profileUrl from formData.
    // This value might have been cleared by the "Remove Current Image" button.
    let profileUrlForPayload = formData.profileUrl || "";

    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadResponse = await employeeApi.uploadProfileImage(selectedFile);
        profileUrlForPayload = uploadResponse.fileUrl; // This will be a new relative URL
        addToast("Profile image uploaded.", "success");
      } catch (uploadError) {
        const msg = uploadError instanceof Error ? uploadError.message : "Failed to upload profile image.";
        addToast(msg, "error");
        setIsLoading(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    // If selectedFile is null, profileUrlForPayload remains what was in formData.profileUrl.
    // If "Remove Current Image" was clicked, formData.profileUrl would be "", so profileUrlForPayload becomes "".

    const salary = parseFloat(String(formData.empSalary));

    try {
      let savedEmployeeResponse: EmployeeFromAPI;
      if (isCreating) {
        const payload: EmployeeCreatePayload = {
          empId: formData.empId!,
          citizenId: formData.citizenId!,
          firstname: formData.firstname!,
          lastname: formData.lastname!,
          gender: formData.gender!,
          phoneNum: formData.phoneNum!,
          address: formData.address || undefined,
          profileUrl: profileUrlForPayload || undefined, // Send the final URL
          empRole: formData.empRole!,
          empSalary: salary,
          password: formData.password,
        };
        savedEmployeeResponse = await employeeApi.create(payload);
        addToast(`Employee "${savedEmployeeResponse.firstname}" created.`, "success");
        onSaveSuccess(savedEmployeeResponse, 'create');
      } else {
        const payload: EmployeeUpdatePayload = {
          firstname: formData.firstname,
          lastname: formData.lastname,
          gender: formData.gender,
          phoneNum: formData.phoneNum,
          address: formData.address || undefined,
          profileUrl: profileUrlForPayload || undefined, // Send the final URL (could be "" or a new one)
          empRole: formData.empRole,
          empSalary: salary,
        };
        savedEmployeeResponse = await employeeApi.update(initialData!.empId, payload);
        addToast(`Employee "${savedEmployeeResponse.firstname}" updated.`, "success");
        onSaveSuccess(savedEmployeeResponse, 'update');
        setIsEditing(false);
      }
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      // After save, update formData to reflect the saved state, especially profileUrl
      setFormData(prev => ({...prev, profileUrl: profileUrlForPayload }));
      // Image preview will update based on the new formData.profileUrl via its useEffect
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save employee.";
      addToast(msg, "error");
      console.error("Save employee error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const confirmDelete = async () => {
    if (!initialData?.empId || !onDeleteSuccess) return;
    setIsLoading(true);
    try {
      await employeeApi.delete(initialData.empId);
      addToast(`Employee "${initialData.firstname}" deleted.`, "success");
      onDeleteSuccess(initialData.empId);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete employee.";
      addToast(msg, "error");
      console.error("Delete employee error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500";
  const readOnlyInputClass = "mt-1 block w-full px-3 py-2 border-gray-200 bg-gray-50 rounded-lg text-gray-700 sm:text-sm cursor-default";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full z-10"
        aria-label="Close details"
        title="Close details"
        disabled={isLoading || isUploading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-center justify-between mb-6 pr-8">
        <h2 className="text-lg font-medium">
          {isCreating ? "Add New Employee" : "Employee Details"}
        </h2>
        {!isCreating && !isEditing && onDeleteSuccess && (
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading || isUploading}
              aria-label="Options"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
                <button onClick={handleEditClick} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">Edit</button>
                <button onClick={handleDeleteClick} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 pb-4">
        <div className="flex flex-col items-center space-y-3 mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
                {imagePreview ? (
                    <img
                        src={imagePreview}
                        alt="Profile Preview"
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                        onError={() => {
                            // If an error occurs loading the image (e.g., broken link from API),
                            // clear the preview and potentially the URL in formData if appropriate.
                            setImagePreview(null);
                            if (isEditing && formData.profileUrl) {
                                // Optionally, also clear it from form data if it's a bad URL
                                // setFormData(prev => ({...prev, profileUrl: ""}));
                            }
                        }}
                    />
                ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                )}
            </div>
            {isEditing && (
                <div className="flex flex-col items-center space-y-2">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        id="profileImageUpload"
                        disabled={isLoading || isUploading}
                    />
                    <label
                        htmlFor="profileImageUpload"
                        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150
                                    ${isLoading || isUploading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'}`}
                    >
                        {isUploading ? "Uploading..." : (selectedFile ? "Change Image" : "Upload Image")}
                    </label>
                    {imagePreview && selectedFile && (
                         <button type="button" onClick={() => {
                                setSelectedFile(null);
                                if(fileInputRef.current) fileInputRef.current.value = "";
                                // Revert preview to original image or null if no original
                                setFormData(prev => ({...prev, profileUrl: initialData?.profileUrl || ""}));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50" disabled={isLoading || isUploading}>
                            Clear Selection
                        </button>
                    )}
                    {!isCreating && isEditing && !selectedFile && ( // Show "Remove Current Image" only if there's an image to remove and no new file selected
                         <button type="button" onClick={() => {
                                setFormData(prev => ({...prev, profileUrl: ""})); // This clears the URL in the form
                                // The useEffect for imagePreview will then set it to null
                            }}
                            className="text-xs text-red-500 hover:text-red-700 mt-1 disabled:opacity-50"
                            disabled={isLoading || isUploading || !formData.profileUrl} // Disable if no profileUrl in form
                            hidden={!formData.profileUrl} // Hide if no profileUrl in form
                            >
                            Remove Current Image
                        </button>
                    )}
                </div>
            )}
        </div>

        <div>
          <label htmlFor="empId" className="block text-sm font-medium text-gray-700">Employee ID</label>
          <input type="text" name="empId" id="empId" value={formData.empId || ""}
            onChange={handleInputChange} readOnly={!isCreating || isLoading}
            className={isCreating ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading} />
        </div>
        <div>
          <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700">Citizen ID</label>
          <input type="text" name="citizenId" id="citizenId" value={formData.citizenId || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || !isCreating} // Citizen ID typically not editable after creation
            className={(isEditing && isCreating) ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading || (!isCreating && isEditing)} />
        </div>
         <div>
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" name="firstname" id="firstname" value={formData.firstname || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading}
            className={isEditing ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Last Name</label>
          <input type="text" name="lastname" id="lastname" value={formData.lastname || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading}
            className={isEditing ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
          <select name="gender" id="gender" value={formData.gender || "M"}
            onChange={handleInputChange} disabled={!isEditing || isLoading || isUploading}
            className={isEditing ? inputClass : readOnlyInputClass}
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="phoneNum" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" name="phoneNum" id="phoneNum" value={formData.phoneNum || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading} maxLength={10}
            className={isEditing ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <textarea name="address" id="address" value={formData.address || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading} rows={3}
            className={isEditing ? inputClass : readOnlyInputClass} disabled={isLoading || isUploading}/>
        </div>
         <div>
          <label htmlFor="empRole" className="block text-sm font-medium text-gray-700">Role</label>
          <input type="text" name="empRole" id="empRole" value={formData.empRole || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading}
            className={isEditing ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="empSalary" className="block text-sm font-medium text-gray-700">Salary</label>
          <input type="number" name="empSalary" id="empSalary" value={formData.empSalary || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading} step="any" min="0"
            className={isEditing ? inputClass : readOnlyInputClass} required disabled={isLoading || isUploading}/>
        </div>

        {/* Removed manual Profile Image URL input, relying on upload and display */}

        {isCreating && isEditing && (
          <>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" id="password" value={formData.password || ""}
                onChange={handleInputChange} disabled={isLoading || isUploading}
                className={inputClass} required={isCreating} />
            </div>
            <div>
              <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword || ""}
                onChange={handleInputChange} disabled={isLoading || isUploading}
                className={inputClass} required={isCreating}/>
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={handleCancelEditingClick} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            {isLoading ? "Saving..." : (isCreating ? "Add Employee" : "Save Changes")}
          </button>
        </div>
      )}
      {!isCreating && !isEditing && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleEditClick} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Edit Employee</button>
        </div>
      )}

      {isDeleteConfirmOpen && initialData?.empId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete employee "{initialData.firstname} {initialData.lastname}"?</p>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} disabled={isLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isLoading} className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50">
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}