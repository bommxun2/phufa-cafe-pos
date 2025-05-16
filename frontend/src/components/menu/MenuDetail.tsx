// src/components/menu/MenuDetail.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { MenuItem, RecipeItem } from '@/types/menu';
import type { IngredientCategory, IngredientFromAPI } from '@/types/ingredient';
import { API_BASE_URL, API_PUBLIC_URL } from '@/lib/apiConfig';
import { menuApi } from '@/services/menuApi'; // Assuming you created/updated menuApi

interface IngredientOption {
  ingredientId: string;
  name: string;
}

// Assuming FileUploadResponse is similar to what employeeApi returns
// interface FileUploadResponse {
//   message: string;
//   fileUrl: string;
// }

interface MenuDetailProps {
  menu: MenuItem | null;
  isCreating?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
}

const initialFormState: MenuItem = {
  menuName: '',
  menuPrice: 0,
  menuStatus: 'พร้อมขาย',
  menuDescription: '',
  menuUrl: '',
  menuCategory: '',
  defaultRecipe: []
};

export default function MenuDetail({ menu, isCreating = false, onSaved, onCancel }: MenuDetailProps) {
  const { addToast } = useToast();
  const [form, setForm] = useState<MenuItem>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [allIngredientCategories, setAllIngredientCategories] = useState<IngredientCategory[]>([]);
  const [ingredientsByCatId, setIngredientsByCatId] = useState<Record<string, IngredientOption[]>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const constructFullImageUrl = (relativeUrl: string | undefined | null): string | null => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('blob:')) { // Also check for blob URLs from createObjectURL
        return relativeUrl;
    }
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return API_PUBLIC_URL ? `${API_PUBLIC_URL}${path}` : path;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/ingredient-categories`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load ingredient categories');
        return res.json();
      })
      .then((data: IngredientCategory[]) => setAllIngredientCategories(data))
      .catch(err => {
        console.error('Load ingredient categories failed:', err);
        addToast(`Error loading ingredient categories: ${err.message}`, "error");
      });
  }, [addToast]);

  useEffect(() => {
    if (!isCreating && menu) {
      setForm(menu);
      // Construct and set imagePreview based on menu.menuUrl
      setImagePreview(constructFullImageUrl(menu.menuUrl));
      setSelectedFile(null);
      menu.defaultRecipe.forEach(recipeItem => {
        if (recipeItem.categoryId && !ingredientsByCatId[recipeItem.categoryId]) {
          loadIngredientsForCategory(recipeItem.categoryId);
        }
      });
    } else if (isCreating) {
      setForm(initialFormState);
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [menu, isCreating]); // Removed ingredientsByCatId to prevent potential loops if it's modified by loadIngredientsForCategory

   useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl); // This will be a blob URL
      return () => URL.revokeObjectURL(objectUrl);
    } else if (form.menuUrl) {
      // If no file is selected, use the menuUrl from the form state for preview
      setImagePreview(constructFullImageUrl(form.menuUrl));
    } else {
      // If no file and no menuUrl in form, clear preview
      setImagePreview(null);
    }
  }, [selectedFile, form.menuUrl]);


  const loadIngredientsForCategory = async (categoryId: string) => {
    if (!categoryId || ingredientsByCatId[categoryId]) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ingredient-categories/${categoryId}/ingredients`);
      if (!res.ok) throw new Error(`Failed to load ingredients for category ${categoryId}`);
      const data: IngredientFromAPI[] = await res.json();
      setIngredientsByCatId(prev => ({ ...prev, [categoryId]: data.map(ing => ({ ingredientId: ing.ingredientId, name: ing.name })) }));
    } catch (err: any) {
      addToast(`Error loading ingredients: ${err.message}`, "error");
    }
  };

  const handleBasicInputChange = (field: keyof Omit<MenuItem, 'defaultRecipe' | 'menuPrice' | 'menuUrl'>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInputChange = (field: 'menuPrice', value: string) => {
    const numValue = parseFloat(value);
    setForm(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
  };

  const handleRecipeItemChange = (index: number, field: keyof RecipeItem, value: string | number | boolean) => {
    const newRecipe = form.defaultRecipe.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'categoryId') {
          loadIngredientsForCategory(value as string);
          updatedItem.ingredientId = "";
        }
        return updatedItem;
      }
      return item;
    });
    setForm(prev => ({ ...prev, defaultRecipe: newRecipe }));
  };

  const handleAddRecipeItem = () => {
    if (allIngredientCategories.length === 0) { addToast('Ingredient categories not loaded yet.', "warning"); return; }
    const firstCategoryId = allIngredientCategories[0]?.ingredientCategoryId || "";
    if (firstCategoryId && !ingredientsByCatId[firstCategoryId]) { loadIngredientsForCategory(firstCategoryId); }
    setForm(prev => ({ ...prev, defaultRecipe: [ ...prev.defaultRecipe,
        { categoryId: firstCategoryId, ingredientId: '', quantity: 0, isBaseIngredient: true, isReplaceable: false } ] }));
  };

  const handleRemoveRecipeItem = (index: number) => {
    setForm(prev => ({ ...prev, defaultRecipe: prev.defaultRecipe.filter((_, i) => i !== index) }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { addToast("Image is too large (Max 2MB).", "error"); if(fileInputRef.current) fileInputRef.current.value = ""; return; }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { addToast("Invalid image type (JPG, PNG, GIF, WEBP only).", "error"); if(fileInputRef.current) fileInputRef.current.value = ""; return; }
      setSelectedFile(file);
      // When a new file is selected, imagePreview useEffect will handle updating the preview.
      // We don't need to immediately clear form.menuUrl as handleSave prioritizes selectedFile.
    } else {
      setSelectedFile(null); // No file, or selection cancelled
    }
  };

  const handleRemoveCurrentImage = () => {
    setSelectedFile(null);
    setForm(prev => ({ ...prev, menuUrl: "" })); // Clear menuUrl in form state
    if (fileInputRef.current) fileInputRef.current.value = "";
    // imagePreview useEffect will set preview to null
  };

  const validateForm = (): boolean => {
    if (!form.menuName.trim()) { addToast("Menu Name is required.", "error"); return false; }
    if (form.menuPrice <= 0) { addToast("Menu Price must be positive.", "error"); return false; }
    if (!form.menuCategory.trim()) { addToast("Menu Category is required.", "error"); return false; }
    if (form.defaultRecipe.some(item => !item.ingredientId || Number(item.quantity) <= 0)) {
        addToast("All recipe items must have an ingredient and quantity > 0.", "error"); return false;
    }
    return true;
  }

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    let finalMenuUrl = form.menuUrl || "";

    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadResponse = await menuApi.uploadMenuImage(selectedFile);
        finalMenuUrl = uploadResponse.fileUrl;
        addToast("Menu image uploaded.", "success");
      } catch (uploadError: any) {
        addToast(uploadError.message || "Failed to upload menu image.", "error");
        setIsLoading(false); setIsUploading(false); return;
      } finally {
        setIsUploading(false);
      }
    }

    const payload: MenuItem = { ...form, menuUrl: finalMenuUrl, menuPrice: Number(form.menuPrice),
      defaultRecipe: form.defaultRecipe.map(r => ({ ...r, quantity: Number(r.quantity) })) };

    try {
      if (isCreating) { await menuApi.create(payload); }
      else if (form.menuId) { await menuApi.update(form.menuId, payload); }
      else { throw new Error("Menu ID is missing for update."); }
      addToast(`Menu "${form.menuName}" ${isCreating ? 'created' : 'updated'} successfully!`, 'success');
      
      setSelectedFile(null); // Clear selected file from component state
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      setForm(prev => ({ ...prev, menuUrl: finalMenuUrl })); // Update form state with new URL for preview continuity
      
      onSaved?.();
    } catch (err: any) {
      addToast(`Error: ${err.message || 'Failed to save menu.'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isCreating || !form.menuId) return;
    if (!window.confirm(`Are you sure you want to delete menu "${form.menuName}"?`)) return;
    setIsLoading(true);
    try {
      await menuApi.delete(form.menuId);
      addToast(`Menu "${form.menuName}" deleted.`, "success");
      onSaved?.();
    } catch (err: any) {
      addToast(`Error: ${err.message || 'Failed to delete menu.'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm focus:ring-primary focus:border-primary disabled:bg-gray-100";
  const selectClass = inputClass;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full md:w-[450px] lg:w-[500px]">
      <div className="flex items-center justify-between mb-4">
        {onCancel && (
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" title="Back" disabled={isLoading || isUploading}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <h2 className="text-xl font-semibold text-center flex-grow">
          {isCreating ? 'Add New Menu' : `Edit: ${form.menuName || 'Menu'}`}
        </h2>
        {!isCreating && form.menuId && onSaved && (
          <button onClick={handleDelete} className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm" disabled={isLoading || isUploading}>Delete</button>
        )}
      </div>

      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {/* --- Image Upload UI Section --- */}
        <div className="space-y-2 mb-3">
            <label className="block text-sm font-medium text-gray-700">Menu Image</label>
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 relative">
                {imagePreview ? (
                <img
                    src={imagePreview} // This will be a blob URL for new uploads or full URL for existing
                    alt={form.menuName || "Menu image preview"}
                    className="object-cover w-full h-full" // Changed to object-cover to fill the area
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-menu-placeholder.png'; }} // Fallback placeholder
                />
                ) : (
                <div className="text-center p-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 2MB</p>
                </div>
                )}
            </div>
            <div className="flex flex-col items-center space-y-1.5 mt-2">
                <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileChange} className="hidden" ref={fileInputRef} id="menuImageUpload" disabled={isLoading || isUploading} />
                <label htmlFor="menuImageUpload"
                    className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap
                                ${isLoading || isUploading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {isUploading ? "Uploading..." : (selectedFile ? "Change Image" : "Upload Image")}
                </label>
                {imagePreview && ( // Show remove button only if there's an image preview
                    <button type="button" onClick={handleRemoveCurrentImage}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    disabled={isLoading || isUploading}>
                    Remove Current Image
                    </button>
                )}
            </div>
        </div>
        {/* --- End Image Upload UI Section --- */}


        {!isCreating && form.menuId && (
            <div>
            <label className="block text-sm font-medium text-gray-700">Menu ID</label>
            <input type="text" value={form.menuId} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
            </div>
        )}
        <div>
          <label htmlFor="menuName" className="block text-sm font-medium text-gray-700">Name*</label>
          <input type="text" id="menuName" value={form.menuName} onChange={(e) => handleBasicInputChange('menuName', e.target.value)} className={inputClass} disabled={isLoading || isUploading} />
        </div>
        <div>
          <label htmlFor="menuPrice" className="block text-sm font-medium text-gray-700">Price (THB)*</label>
          <input type="number" id="menuPrice" value={form.menuPrice} onChange={(e) => handleNumberInputChange('menuPrice', e.target.value)} className={inputClass} disabled={isLoading || isUploading} min="0" step="any"/>
        </div>
        <div>
          <label htmlFor="menuStatus" className="block text-sm font-medium text-gray-700">Status*</label>
          <select id="menuStatus" value={form.menuStatus} onChange={(e) => handleBasicInputChange('menuStatus', e.target.value)} className={selectClass} disabled={isLoading || isUploading}>
            <option value="พร้อมขาย">พร้อมขาย (Sellable)</option>
            <option value="ไม่พร้อมขาย">ไม่พร้อมขาย (Not Sellable)</option>
          </select>
        </div>
        <div>
          <label htmlFor="menuCategory" className="block text-sm font-medium text-gray-700">Category*</label>
          <input type="text" id="menuCategory" value={form.menuCategory} onChange={(e) => handleBasicInputChange('menuCategory', e.target.value)} className={inputClass} placeholder="e.g., กาแฟ, ชา" disabled={isLoading || isUploading} />
        </div>
        <div>
          <label htmlFor="menuDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="menuDescription" value={form.menuDescription} onChange={(e) => handleBasicInputChange('menuDescription', e.target.value)} className={inputClass} rows={2} disabled={isLoading || isUploading} />
        </div>
        
        <div className="pt-2">
          <h3 className="text-md font-medium text-gray-800 mb-2">Default Recipe*</h3>
          {form.defaultRecipe.map((recipeItem, index) => {
            const availableIngredients = ingredientsByCatId[recipeItem.categoryId] || [];
            return (
              <div key={index} className="border p-3 mb-3 rounded-lg bg-gray-50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor={`recipeCat-${index}`} className="block text-xs font-medium text-gray-600">Ingredient Category</label>
                        <select id={`recipeCat-${index}`} value={recipeItem.categoryId} onChange={(e) => handleRecipeItemChange(index, 'categoryId', e.target.value)} className={selectClass} disabled={isLoading || isUploading || allIngredientCategories.length === 0}>
                            <option value="" disabled>Select Category</option>
                            {allIngredientCategories.map(cat => (<option key={cat.ingredientCategoryId} value={cat.ingredientCategoryId}>{cat.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`recipeIng-${index}`} className="block text-xs font-medium text-gray-600">Ingredient</label>
                        <select id={`recipeIng-${index}`} value={recipeItem.ingredientId} onChange={(e) => handleRecipeItemChange(index, 'ingredientId', e.target.value)} className={selectClass} disabled={isLoading || isUploading || !recipeItem.categoryId || availableIngredients.length === 0}>
                            <option value="" disabled>Select Ingredient</option>
                            {availableIngredients.map(ing => (<option key={ing.ingredientId} value={ing.ingredientId}>{ing.name}</option>))}
                        </select>
                    </div>
                </div>
                <div>
                  <label htmlFor={`recipeQty-${index}`} className="block text-xs font-medium text-gray-600">Quantity</label>
                  <input type="number" id={`recipeQty-${index}`} value={recipeItem.quantity} onChange={(e) => handleRecipeItemChange(index, 'quantity', parseFloat(e.target.value))} className={inputClass} placeholder="e.g., 50" disabled={isLoading || isUploading} min="0.01" step="any"/>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-4">
                        <label className="flex items-center text-xs text-gray-600">
                        <input type="checkbox" checked={recipeItem.isBaseIngredient} onChange={(e) => handleRecipeItemChange(index, 'isBaseIngredient', e.target.checked)} className="mr-1.5 h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded" disabled={isLoading || isUploading}/>Base</label>
                        <label className="flex items-center text-xs text-gray-600">
                        <input type="checkbox" checked={recipeItem.isReplaceable} onChange={(e) => handleRecipeItemChange(index, 'isReplaceable', e.target.checked)} className="mr-1.5 h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded" disabled={isLoading || isUploading}/>Replaceable</label>
                    </div>
                    <button type="button" onClick={() => handleRemoveRecipeItem(index)} className="text-xs text-red-500 hover:text-red-700" disabled={isLoading || isUploading}>Remove</button>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={handleAddRecipeItem} className="mt-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50" disabled={isLoading || isUploading || allIngredientCategories.length === 0}>
            + Add Recipe Ingredient
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70" disabled={isLoading || isUploading}>
          {isLoading ? (isUploading ? 'Uploading...' : (isCreating ? 'Creating...' : 'Saving...')) : (isCreating ? 'Create Menu' : 'Save Changes')}
        </button>
      </div>
    </div>
  );
}