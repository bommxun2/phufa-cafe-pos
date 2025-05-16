// src/components/employee/EmployeeDetail.tsx
import { useState, useEffect, useRef } from 'react';
// import Image from 'next/image'; // next/image is imported but standard img tag is used for preview
import { useEmployeeForm } from '@/hooks/useEmployeeForm';
import { employeeApi } from '@/services/employeeApi';
import type { EmployeeFormData, EmployeeFromAPI, EmployeeCreatePayload, EmployeeUpdatePayload } from '@/types/employee';
import { useToast } from '@/contexts/ToastContext';
import { API_PUBLIC_URL, API_BASE_URL } from '@/lib/apiConfig'; // Import API_PUBLIC_URL for image previews

interface EmployeeDetailProps {
  employee?: EmployeeFromAPI; // This is initialData
  onSaveSuccess: (savedEmployee: EmployeeFromAPI, mode: 'create' | 'update') => void;
  onDeleteSuccess?: (empId: string) => void;
  onCancel: () => void;
}

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
  const [isLoading, setIsLoading] = useState(false); // For save/delete operations
  const [isUploading, setIsUploading] = useState(false); // Specifically for image upload
  const dropdownRef = useRef<HTMLDivElement>(null);

  const constructFullImageUrl = (relativeUrl: string | undefined | null): string | null => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl; // Already a full URL
    }
    // Ensure relativeUrl starts with a slash if API_PUBLIC_URL is empty (same domain)
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return API_PUBLIC_URL ? `${API_PUBLIC_URL}${path}` : path;
  };


  useEffect(() => {
    if (!isCreating && initialData) {
      setIsEditing(false);
      setImagePreview(constructFullImageUrl(initialData.profileUrl));
      setSelectedFile(null);
    } else {
      setIsEditing(true);
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [initialData, isCreating]);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (formData.profileUrl) {
      setImagePreview(constructFullImageUrl(formData.profileUrl));
    } else {
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
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        addToast("File is too large. Maximum 2MB allowed.", "error");
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addToast("Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.", "error");
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
        return;
      }
      setSelectedFile(file);
      // No need to clear formData.profileUrl here; handleSave will prioritize selectedFile.
    } else {
      setSelectedFile(null); // No file selected or selection cancelled
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
      resetForm(); // Resets formData (including profileUrl to initialData.profileUrl)
      setSelectedFile(null); // Clear any selected file that wasn't saved
      // Image preview will update via useEffect due to formData.profileUrl change from resetForm
      setIsEditing(false);
    }
  };

  const validateFormData = (): boolean => {
    // EmpId validation only for creation and if it's manually entered
    if (isCreating && !formData.empId?.trim()) {
        addToast("Employee ID is required.", "error"); return false;
    }
    if (!formData.citizenId?.trim() || !/^\d{13}$/.test(formData.citizenId)) {
      addToast("A valid 13-digit Citizen ID is required.", "error"); return false;
    }
    if (!formData.firstname?.trim() || !formData.lastname?.trim()) {
      addToast("First name and Last name are required.", "error"); return false;
    }
    if (!formData.phoneNum?.trim() || !/^\d{10}$/.test(formData.phoneNum)) {
      addToast("A valid 10-digit Phone Number is required.", "error"); return false;
    }
    if (!formData.empRole?.trim()) {
      addToast("Employee Role is required.", "error"); return false;
    }
    const salary = parseFloat(String(formData.empSalary)); // empSalary is string in form
    if (isNaN(salary) || salary < 0) {
      addToast("A valid non-negative Salary is required.", "error"); return false;
    }
    if (isCreating) {
        if (!formData.password) { // Check for undefined or empty string
            addToast("Password is required for new employees.", "error"); return false;
        }
        if (formData.password.length < 6) { // Example minimum length
            addToast("Password must be at least 6 characters long.", "error"); return false;
        }
        if (formData.password !== formData.confirmPassword) {
            addToast("Passwords do not match.", "error"); return false;
        }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);
    let finalProfileUrl = formData.profileUrl || ""; // Start with current URL (could be "" if removed)

    if (selectedFile) {
      setIsUploading(true);
      try {
        // The API returns a relative URL like "/uploads/profiles/image.jpg"
        const uploadResponse = await employeeApi.uploadProfileImage(selectedFile);
        finalProfileUrl = uploadResponse.fileUrl; // This is the new relative URL
        addToast("Profile image uploaded successfully.", "success");
      } catch (uploadError: any) {
        addToast(uploadError.message || "Failed to upload profile image.", "error");
        setIsLoading(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    // If no new file selected, finalProfileUrl remains as formData.profileUrl
    // (which could be empty if "Remove Current Image" was used).

    const salary = parseFloat(String(formData.empSalary)); // Convert form string to number

    try {
      let savedEmployeeResponse: EmployeeFromAPI;
      if (isCreating) {
        const createPayload: EmployeeCreatePayload = {
          empId: formData.empId!, // Already validated
          citizenId: formData.citizenId!,
          firstname: formData.firstname!,
          lastname: formData.lastname!,
          gender: formData.gender!,
          phoneNum: formData.phoneNum!,
          address: formData.address || undefined,
          profileUrl: finalProfileUrl || undefined, // Send final URL (can be empty)
          empRole: formData.empRole!,
          empSalary: salary,
          password: formData.password!, // Already validated
        };
        savedEmployeeResponse = await employeeApi.create(createPayload);
        addToast(`Employee "${savedEmployeeResponse.firstname}" created successfully.`, "success");
        onSaveSuccess(savedEmployeeResponse, 'create');
      } else {
        // For update, empId and citizenId are typically not in the payload (not updatable via this form)
        const updatePayload: EmployeeUpdatePayload = {
          firstname: formData.firstname,
          lastname: formData.lastname,
          gender: formData.gender,
          phoneNum: formData.phoneNum,
          address: formData.address || undefined,
          profileUrl: finalProfileUrl || undefined, // Send final URL
          empRole: formData.empRole,
          empSalary: salary,
          // Password update is usually a separate flow/endpoint
        };
        savedEmployeeResponse = await employeeApi.update(initialData!.empId, updatePayload);
        addToast(`Employee "${savedEmployeeResponse.firstname}" updated successfully.`, "success");
        setFormData(prev => ({ ...prev, profileUrl: finalProfileUrl, password:"", confirmPassword:"" })); // Update form with new URL, clear passwords
        setIsEditing(false); // Exit edit mode
        onSaveSuccess(savedEmployeeResponse, 'update');
      }
      setSelectedFile(null); // Clear selected file after successful save
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input

    } catch (error: any) {
      addToast(error.message || "Failed to save employee data.", "error");
      console.error("Error saving employee:", error);
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
      addToast(`Employee "${initialData.firstname} ${initialData.lastname}" deleted.`, "success");
      onDeleteSuccess(initialData.empId);
      setIsDeleteConfirmOpen(false);
      // onCancel(); // Optionally close detail view
    } catch (error: any) {
      addToast(error.message || "Failed to delete employee.", "error");
    } finally {
      setIsLoading(false);
    }
  };


  const handleRemoveCurrentImage = () => {
    setSelectedFile(null); // Clear any selected new file
    setFormData(prev => ({ ...prev, profileUrl: "" })); // Clear existing profileUrl from form
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Image preview will become null due to useEffect watching formData.profileUrl
  };

  const inputBaseClass = "mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm focus:ring-primary focus:border-primary disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed";
  const inputClass = `${inputBaseClass} border-gray-300 text-gray-900`;
  const readOnlyInputClass = `${inputBaseClass} border-gray-200 bg-gray-100 text-gray-700 cursor-default`;


  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative">
      <button onClick={onCancel} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full z-10" aria-label="Close" title="Close" disabled={isLoading || isUploading}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="flex items-center justify-between mb-5 pr-8">
        <h2 className="text-lg font-medium text-gray-800">
          {isCreating ? "Add New Employee" : `Employee: ${initialData?.firstname || 'Details'}`}
        </h2>
        {!isCreating && !isEditing && onDeleteSuccess && (
          <div className="relative" ref={dropdownRef}>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setIsDropdownOpen(prev => !prev)} disabled={isLoading || isUploading} aria-label="Options">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-20 ring-1 ring-black ring-opacity-5">
                <button onClick={handleEditClick} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</button>
                <button onClick={handleDeleteClick} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-2 pb-2"> {/* Scrollable Area */}
        {/* Profile Image Section */}
        <div className="flex flex-col items-center space-y-2 mb-3">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile Preview" className="object-cover w-full h-full" onError={() => setImagePreview('/default-avatar.png')} />
            ) : (
              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-col items-center space-y-1.5">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} id="profileImageUpload" disabled={isLoading || isUploading} />
              <label htmlFor="profileImageUpload"
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap
                            ${isLoading || isUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                {isUploading ? "Uploading..." : (selectedFile ? "Change Image" : "Upload Image")}
              </label>
              {imagePreview && ( // Show remove only if there's an image (either existing or newly selected for preview)
                <button type="button" onClick={handleRemoveCurrentImage}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  disabled={isLoading || isUploading}>
                  Remove Current Image
                </button>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div>
          <label htmlFor="empId" className="block text-sm font-medium text-gray-700">Employee ID*</label>
          <input type="text" name="empId" id="empId" value={formData.empId || ""}
            onChange={handleInputChange} readOnly={!isCreating || isLoading || isUploading} // ReadOnly if editing
            className={isCreating && isEditing ? inputClass : readOnlyInputClass} required />
        </div>
        <div>
          <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700">Citizen ID*</label>
          <input type="text" name="citizenId" id="citizenId" value={formData.citizenId || ""}
            onChange={handleInputChange} readOnly={!isCreating || isLoading || isUploading} // ReadOnly if editing
            className={isCreating && isEditing ? inputClass : readOnlyInputClass} required maxLength={13}/>
        </div>
         <div>
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name*</label>
          <input type="text" name="firstname" id="firstname" value={formData.firstname || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading}
            className={isEditing ? inputClass : readOnlyInputClass} required/>
        </div>
        <div>
          <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Last Name*</label>
          <input type="text" name="lastname" id="lastname" value={formData.lastname || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading}
            className={isEditing ? inputClass : readOnlyInputClass} required/>
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender*</label>
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
          <label htmlFor="phoneNum" className="block text-sm font-medium text-gray-700">Phone Number*</label>
          <input type="tel" name="phoneNum" id="phoneNum" value={formData.phoneNum || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading} maxLength={10}
            className={isEditing ? inputClass : readOnlyInputClass} required />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <textarea name="address" id="address" value={formData.address || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading} rows={2}
            className={isEditing ? inputClass : readOnlyInputClass} />
        </div>
         <div>
          <label htmlFor="empRole" className="block text-sm font-medium text-gray-700">Role*</label>
          <input type="text" name="empRole" id="empRole" value={formData.empRole || ""}
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading}
            className={isEditing ? inputClass : readOnlyInputClass} required/>
        </div>
        <div>
          <label htmlFor="empSalary" className="block text-sm font-medium text-gray-700">Salary (THB)*</label>
          <input type="number" name="empSalary" id="empSalary" value={formData.empSalary || ""} // formData.empSalary is string
            onChange={handleInputChange} readOnly={!isEditing || isLoading || isUploading} step="any" min="0"
            className={isEditing ? inputClass : readOnlyInputClass} required/>
        </div>

        {isCreating && isEditing && (
          <>
            <hr className="my-2"/>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password*</label>
              <input type="password" name="password" id="password" value={formData.password || ""}
                onChange={handleInputChange} disabled={isLoading || isUploading}
                className={inputClass} required={isCreating} />
            </div>
            <div>
              <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">Confirm Password*</label>
              <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword || ""}
                onChange={handleInputChange} disabled={isLoading || isUploading}
                className={inputClass} required={isCreating}/>
            </div>
          </>
        )}
      </div> {/* End Scrollable Area */}

      {/* Action Buttons */}
      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={handleCancelEditingClick} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50">
            {isLoading ? "Processing..." : (isCreating ? "Add Employee" : "Save Changes")}
          </button>
        </div>
      )}
      {!isCreating && !isEditing && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleEditClick} disabled={isLoading || isUploading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none">Edit Employee</button>
        </div>
      )}

      {/* Delete Confirmation Modal (same structure as IngredientDetail's) */}
      {isDeleteConfirmOpen && initialData?.empId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" aria-labelledby="delete-employee-modal-title" role="dialog" aria-modal="true">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900" id="delete-employee-modal-title">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete employee "{initialData.firstname} {initialData.lastname}"? This action cannot be undone.</p>
            <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
              <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isLoading}
                className="w-full sm:w-auto justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:text-sm disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={isLoading}
                className="w-full sm:w-auto justify-center rounded-md border border-transparent px-4 py-2 bg-red-600 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:text-sm disabled:opacity-50">
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}