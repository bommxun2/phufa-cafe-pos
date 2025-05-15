// src/components/ingredient/IngredientDetail.tsx

import { useState, useEffect, useRef } from "react";
import { useIngredientForm } from "@/hooks/useIngredientForm";
import { ingredientApi } from "@/services/ingredientApi";
import { useToast } from "@/contexts/ToastContext";

// --- Types (เหมือนเดิม) ---
type IngredientFormData = {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string;
};
type IngredientCategory = {
  ingredientCategoryId: string;
  name: string;
  allowMultipleSelection: boolean;
  isCustomizable: boolean;
};
type IngredientFromAPI = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  adjustmentPrice: number;
  costPerUnit: number;
  category: string;
};
// --- จบ Types ---

interface IngredientDetailProps {
  ingredient?: IngredientFormData;
  categories: IngredientCategory[];
  onSaveSuccess: (
    savedIngredient: IngredientFromAPI,
    mode: "create" | "update"
  ) => void;
  onDeleteSuccess?: (ingredientId: string) => void;
  onCancel: () => void;
}

export default function IngredientDetail({
  ingredient: initialData,
  categories,
  onSaveSuccess,
  onDeleteSuccess,
  onCancel,
}: IngredientDetailProps) {
  const isCreating = !initialData?.ingredientId;
  const [isEditing, setIsEditing] = useState(isCreating);
  const { addToast } = useToast(); // Get addToast function

  const { formData, handleInputChange, resetForm } = useIngredientForm({
    initialData,
    isCreating,
    categories,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCreating) {
      setIsEditing(false);
    }
  }, [initialData, isCreating]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleEditClick = () => {
    setIsEditing(true);
    setIsDropdownOpen(false);
  };

  const handleCancelEditingClick = () => {
    if (isCreating) {
      onCancel();
    } else {
      resetForm();
      setIsEditing(false);
    }
  };

  const validateFormData = (): boolean => {
    if (
      !formData.name?.trim() ||
      !formData.unit?.trim() ||
      !formData.category?.trim()
    ) {
      addToast("Name, Unit, and Category are required.", "error");
      return false;
    }
    const quantity = parseFloat(String(formData.quantity));
    const adjustmentPrice = parseFloat(String(formData.adjustmentPrice ?? 0));
    const costPerUnit = parseFloat(String(formData.costPerUnit));

    if (
      isNaN(quantity) ||
      quantity < 0 ||
      isNaN(adjustmentPrice) ||
      adjustmentPrice < 0 ||
      isNaN(costPerUnit) ||
      costPerUnit < 0
    ) {
      addToast(
        "Quantity, Adjustment Price, and Cost Per Unit must be valid non-negative numbers.",
        "error"
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFormData()) {
      return;
    }
    setIsLoading(true);
    try {
      let savedIngredientResponse: IngredientFromAPI;
      const {
        name,
        quantity,
        unit,
        adjustmentPrice,
        costPerUnit,
        category,
      } = formData;

      if (isCreating) {
        if (!category) {
          addToast("Selected category is invalid.", "error");
          setIsLoading(false);
          return;
        }
        const payload = {
          name: name!,
          quantity: Number(quantity),
          unit: unit!,
          adjustmentPrice: Number(adjustmentPrice),
          costPerUnit: Number(costPerUnit),
          category,
        };
        savedIngredientResponse = await ingredientApi.create(payload);
        addToast(
          `Ingredient "${savedIngredientResponse.name}" created successfully!`,
          "success"
        );
        onSaveSuccess(savedIngredientResponse, "create");
      } else {
        const payload = {
          name,
          quantity: Number(quantity),
          unit,
          adjustmentPrice: Number(adjustmentPrice),
          costPerUnit: Number(costPerUnit),
          category: formData.category,
        };
        savedIngredientResponse = await ingredientApi.update(
          initialData!.ingredientId!,
          payload
        );
        addToast(
          `Ingredient "${savedIngredientResponse.name}" updated successfully!`,
          "success"
        );
        onSaveSuccess(savedIngredientResponse, "update");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving ingredient:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      addToast(`Error saving ingredient: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const confirmDelete = async () => {
    if (!initialData?.ingredientId || !onDeleteSuccess) return;
    setIsLoading(true);
    try {
      await ingredientApi.delete(initialData.ingredientId);
      addToast(
        `Ingredient "${initialData.name}" deleted successfully!`,
        "success"
      );
      onDeleteSuccess(initialData.ingredientId);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      addToast(`Error deleting ingredient: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm focus:ring-primary focus:border-primary";
  const readOnlyInputClass =
    "mt-1 block w-full px-3 py-2 border-gray-200 bg-gray-50 rounded-lg text-gray-700 sm:text-sm cursor-default";

  // --- JSX (เหมือนเดิม ยกเว้นการลบ alert() และเพิ่ม addToast()) ---
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
        aria-label="Close details"
        title="Close details"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex items-center justify-between mb-6 pr-8">
        <h2 className="text-lg font-medium">
          {isCreating ? "Add New Ingredient" : `Ingredient Details`}
        </h2>
        {!isCreating && !isEditing && onDeleteSuccess && (
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Options"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                <button
                  onClick={handleEditClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!isCreating && initialData?.ingredientId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ingredient ID
            </label>
            <input
              type="text"
              value={initialData.ingredientId}
              readOnly
              className={readOnlyInputClass}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name || ""}
            readOnly={!isEditing || isLoading}
            onChange={handleInputChange}
            className={isEditing ? inputClass : readOnlyInputClass}
            required
          />
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            value={formData.quantity === undefined ? "" : formData.quantity}
            readOnly={!isEditing || isLoading}
            onChange={handleInputChange}
            className={isEditing ? inputClass : readOnlyInputClass}
            required
            step="any"
            min="0"
          />
        </div>

        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-gray-700"
          >
            Unit
          </label>
          <input
            type="text"
            name="unit"
            id="unit"
            value={formData.unit || ""}
            readOnly={!isEditing || isLoading}
            onChange={handleInputChange}
            className={isEditing ? inputClass : readOnlyInputClass}
            required
          />
        </div>

        <div>
          <label
            htmlFor="adjustmentPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Adjustment Price
          </label>
          <input
            type="number"
            name="adjustmentPrice"
            id="adjustmentPrice"
            value={
              formData.adjustmentPrice === undefined
                ? ""
                : formData.adjustmentPrice
            }
            readOnly={!isEditing || isLoading}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className={isEditing ? inputClass : readOnlyInputClass}
            required
          />
        </div>

        <div>
          <label
            htmlFor="costPerUnit"
            className="block text-sm font-medium text-gray-700"
          >
            Cost Per Unit
          </label>
          <input
            type="number"
            name="costPerUnit"
            id="costPerUnit"
            value={
              formData.costPerUnit === undefined ? "" : formData.costPerUnit
            }
            readOnly={!isEditing || isLoading}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className={isEditing ? inputClass : readOnlyInputClass}
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            name="category"
            id="category"
            value={formData.category || ""}
            disabled={!isEditing || isLoading}
            onChange={handleInputChange}
            className={isEditing ? inputClass : readOnlyInputClass}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((categoryOpt) => (
              <option
                key={categoryOpt.name}
                value={categoryOpt.name}
              >
                {categoryOpt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancelEditingClick}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !formData.name}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading
              ? "Saving..."
              : isCreating
              ? "Add Ingredient"
              : "Save Changes"}
          </button>
        </div>
      )}
      {!isCreating && !isEditing && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleEditClick}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Edit Ingredient
          </button>
        </div>
      )}

      {isDeleteConfirmOpen && initialData?.ingredientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Deletion
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete ingredient "{initialData.name}"?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
