// src/contexts/ToastContext.tsx (หรือ contexts/ToastContext.tsx ถ้า src ไม่ใช่ root)
"use client"; // Mark this as a Client Component

import React, { createContext, useContext, useState, useCallback } from "react";
import OriginalToastHook, {
  ToastContainer as OriginalToastContainer,
  ToastType as OriginalToastType,
} from "@/components/common/Toast"; // Adjust path to your Toast.tsx

// Re-export ToastType for convenience
export type ToastType = OriginalToastType;

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    toasts,
    addToast: originalAddToast,
    removeToast,
  } = OriginalToastHook();

  // Ensure addToast callback is stable if OriginalToastHook provides a stable one
  // Or wrap with useCallback if necessary, though usually state setters from useState are stable.
  const addToast = useCallback(
    (message: string, type: ToastType) => {
      originalAddToast(message, type);
    },
    [originalAddToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <OriginalToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
