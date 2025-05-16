// src/components/common/Toast.tsx
// No changes needed. This file is well-structured.
import React, { useEffect, useState, useCallback } from "react"; // Added React and useCallback

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastItemProps { // Renamed ToastProps to ToastItemProps for clarity
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const baseClasses = "p-4 rounded-md shadow-lg text-white mb-2 flex justify-between items-center text-sm"; // Added text-sm
  const typeClasses = {
    success: "bg-green-500 hover:bg-green-600",
    error: "bg-red-500 hover:bg-red-600",
    info: "bg-blue-500 hover:bg-blue-600",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-black", // Ensuring contrast for warning
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} transition-all duration-300 ease-in-out transform animate-toast-in`} role="alert">
      <span className="flex-grow">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-3 -mr-1 flex-shrink-0 p-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

let toastIdCounter = 0;

// This custom hook manages the toast messages state.
// It's used internally by ToastProvider, but can also be used directly if needed,
// though ToastContext is the recommended way to add toasts from components.
export default function useToastMessages() { // Changed name to be more descriptive
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = toastIdCounter++;
    // Add new toast to the beginning of the array so it appears on top
    setToasts((prevToasts) => [{ id, message, type }, ...prevToasts]);
  }, []); // Empty dependency array, as addToast only depends on setToasts and toastIdCounter (external)

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []); // Empty dependency array, as removeToast only depends on setToasts

  return { toasts, addToast, removeToast };
}

// Toast Container Component - Renders the list of toasts
export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}> = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-full max-w-xs sm:max-w-sm space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Note: The default export was useToast (which is actually useToastMessages now).
// If ToastContext.tsx relies on this default export name, adjust accordingly there.
// The current ToastContext.tsx imports `OriginalToastHook` which would be this `useToastMessages`.