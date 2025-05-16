// src/components/customer/CustomerDetail.tsx
"use client";

import axios from "axios"; // Keep for customer data POST/PUT
import { useEffect, useState, useRef } from "react";
import type { Customer, CustomerFormData } from "@/types/customer";
import { API_BASE_URL, API_PUBLIC_URL } from "@/lib/apiConfig";
import { useToast } from "@/contexts/ToastContext";
import { employeeApi } from "@/services/employeeApi"; // Import employeeApi for image upload

// FileUploadResponse is defined in employeeApi.ts, but if needed here directly:
interface FileUploadResponse {
  message: string;
  fileUrl: string;
}

interface CustomerDetailProps {
  selectedCustomer: CustomerFormData | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<CustomerFormData | null>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export default function CustomerDetail({
  selectedCustomer,
  setSelectedCustomer,
  setCustomers,
}: CustomerDetailProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const basePointRef = useRef<number>(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const constructFullImageUrl = (relativeUrl: string | undefined | null): string | null => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return API_PUBLIC_URL ? `${API_PUBLIC_URL}${path}` : path;
  };

  useEffect(() => {
    if (selectedCustomer) {
      if (!selectedCustomer.newCustomer) {
        basePointRef.current = selectedCustomer.point || 0;
      } else {
        basePointRef.current = 0;
      }
      setImagePreview(constructFullImageUrl(selectedCustomer.profileUrl));
      setSelectedFile(null);
    } else {
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (selectedCustomer?.profileUrl) {
      setImagePreview(constructFullImageUrl(selectedCustomer.profileUrl));
    } else {
      setImagePreview(null);
    }
  }, [selectedFile, selectedCustomer?.profileUrl]);

  if (!selectedCustomer) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        Select a customer to view details or click "Add New Customer".
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSelectedCustomer(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handlePointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pointValue = parseInt(e.target.value);
    setSelectedCustomer(prev => prev ? { ...prev, point: isNaN(pointValue) ? 0 : pointValue } : null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast("File is too large. Maximum 2MB allowed.", "error");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addToast("Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.", "error");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleRemoveCurrentImage = () => {
    setSelectedFile(null);
    setSelectedCustomer(prev => prev ? { ...prev, profileUrl: "" } : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = (): boolean => {
    if (!selectedCustomer.citizenId?.trim() || !/^\d{13}$/.test(selectedCustomer.citizenId)) {
      addToast("Valid 13-digit Citizen ID is required.", "error"); return false;
    }
    if (!selectedCustomer.firstname?.trim() || !selectedCustomer.lastname?.trim()) {
      addToast("First name and Last name are required.", "error"); return false;
    }
    if (!selectedCustomer.phoneNum?.trim() || !/^\d{10}$/.test(selectedCustomer.phoneNum)) {
      addToast("Valid 10-digit Phone number is required.", "error"); return false;
    }
    if (selectedCustomer.point === undefined || selectedCustomer.point < 0) {
        addToast("Points must be a non-negative number.", "error"); return false;
    }
    return true;
  };

  const saveCustomer = async () => {
    if (!selectedCustomer || !validateForm()) return;
    setIsLoading(true);

    let finalProfileUrl = selectedCustomer.profileUrl || "";

    if (selectedFile) {
      setIsUploading(true);
      try {
        // MODIFICATION: Use employeeApi.uploadProfileImage
        const uploadResponse = await employeeApi.uploadProfileImage(selectedFile);
        finalProfileUrl = uploadResponse.fileUrl;
        addToast("Customer image uploaded.", "success");
      } catch (uploadError: any) {
        addToast(uploadError.message || "Failed to upload image.", "error");
        setIsLoading(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const customerPayload = {
      citizenId: selectedCustomer.citizenId!,
      firstname: selectedCustomer.firstname!,
      lastname: selectedCustomer.lastname!,
      gender: selectedCustomer.gender,
      phoneNum: selectedCustomer.phoneNum!,
      address: selectedCustomer.address,
      profileUrl: finalProfileUrl || undefined,
    };

    try {
      let savedApiCustomer: Customer;

      if (selectedCustomer.newCustomer) {
        const response = await axios.post<Customer>(`${API_BASE_URL}/customers`, customerPayload);
        savedApiCustomer = response.data;
        // API response for POST /customers might not include profileUrl if it's just PersonBase.
        // We explicitly set it here from what we intended to save.
        savedApiCustomer.profileUrl = finalProfileUrl;

        if (selectedCustomer.point > 0) {
          await axios.post(`${API_BASE_URL}/customers/${savedApiCustomer.citizenId}/points`, {
            pointsToAdd: selectedCustomer.point,
          });
          savedApiCustomer.point = selectedCustomer.point;
        } else {
          savedApiCustomer.point = savedApiCustomer.point || 0; // Ensure point is initialized
        }
        addToast("Customer created successfully!", "success");
        setCustomers(prev => [...prev, { ...savedApiCustomer }]);
        setSelectedCustomer({ ...savedApiCustomer, newCustomer: false, profileUrl: finalProfileUrl });
      } else {
        const response = await axios.put<Customer>(`${API_BASE_URL}/customers/${selectedCustomer.citizenId}`, customerPayload);
        savedApiCustomer = response.data;
        // API response for PUT /customers might not include profileUrl.
        savedApiCustomer.profileUrl = finalProfileUrl;

        const pointsDelta = (selectedCustomer.point || 0) - basePointRef.current;
        if (pointsDelta !== 0) {
          await axios.post(`${API_BASE_URL}/customers/${savedApiCustomer.citizenId}/points`, {
            pointsToAdd: pointsDelta,
          });
          savedApiCustomer.point = (selectedCustomer.point || 0);
        } else {
          savedApiCustomer.point = response.data.point !== undefined ? response.data.point : basePointRef.current;
        }

        addToast("Customer updated successfully!", "success");
        setCustomers(prev => prev.map(c => c.citizenId === savedApiCustomer.citizenId ? { ...savedApiCustomer } : c));
        setSelectedCustomer({ ...savedApiCustomer, newCustomer: false, profileUrl: finalProfileUrl });
        basePointRef.current = savedApiCustomer.point;
      }
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (err: any) {
      console.error("Error saving customer:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message) || "An unexpected error occurred.";
      addToast(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass = "mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm focus:ring-primary focus:border-primary disabled:bg-gray-200";
  const inputClass = `${inputBaseClass} border-gray-300 text-gray-900`;
  const readOnlyInputClass = `${inputBaseClass} border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">
          {selectedCustomer.newCustomer ? "Add New Customer" : `Edit: ${selectedCustomer.firstname || "Customer"}`}
        </h2>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 pb-2">
        <div className="flex flex-col items-center space-y-2 mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                {imagePreview ? (
                <img src={imagePreview} alt="Profile Preview" className="object-cover w-full h-full" onError={() => setImagePreview('/default-avatar.png')} />
                ) : (
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                )}
            </div>
            <div className="flex flex-col items-center space-y-1.5">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} id="customerProfileImageUpload" disabled={isLoading || isUploading} />
                <label htmlFor="customerProfileImageUpload"
                    className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap
                                ${isLoading || isUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                    {isUploading ? "Uploading..." : (selectedFile ? "Change Image" : "Upload Image")}
                </label>
                {imagePreview && ( // Show remove button only if there's an image preview
                    <button type="button" onClick={handleRemoveCurrentImage}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    disabled={isLoading || isUploading}>
                    Remove Current Image
                    </button>
                )}
            </div>
        </div>

        <div>
          <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700">Citizen ID*</label>
          <input type="text" id="citizenId" name="citizenId" value={selectedCustomer.citizenId || ""}
            onChange={handleInputChange} readOnly={!selectedCustomer.newCustomer || isLoading || isUploading}
            className={selectedCustomer.newCustomer && !(isLoading || isUploading) ? inputClass : readOnlyInputClass} maxLength={13} />
        </div>
        <div>
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name*</label>
          <input type="text" id="firstname" name="firstname" value={selectedCustomer.firstname || ""} onChange={handleInputChange} className={inputClass} disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Last Name*</label>
          <input type="text" id="lastname" name="lastname" value={selectedCustomer.lastname || ""} onChange={handleInputChange} className={inputClass} disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
          <select id="gender" name="gender" value={selectedCustomer.gender || ""} onChange={handleInputChange} className={inputClass} disabled={isLoading || isUploading}>
            <option value="" disabled>Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="phoneNum" className="block text-sm font-medium text-gray-700">Phone Number*</label>
          <input type="tel" id="phoneNum" name="phoneNum" value={selectedCustomer.phoneNum || ""} onChange={handleInputChange} className={inputClass} maxLength={10} disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <textarea id="address" name="address" value={selectedCustomer.address || ""} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} disabled={isLoading || isUploading}/>
        </div>
        <div>
          <label htmlFor="point" className="block text-sm font-medium text-gray-700">Points*</label>
          <input type="number" id="point" name="point" value={selectedCustomer.point ?? 0} onChange={handlePointChange} className={inputClass} min="0" disabled={isLoading || isUploading}/>
        </div>
      </div>

      <button
        className="mt-6 w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
        onClick={saveCustomer}
        disabled={isLoading || isUploading}
      >
        {isLoading ? "Saving..." : (isUploading ? "Uploading..." : "Save Customer")}
      </button>
    </div>
  );
}