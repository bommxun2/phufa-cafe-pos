// src/contexts/ToastContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import OriginalToastHook, {
  ToastContainer as OriginalToastContainer,
  ToastType as OriginalToastType,
} from "@/components/common/Toast"; // Adjust path if your Toast.tsx is elsewhere

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

  // addToast from useState (via OriginalToastHook) is typically stable,
  // but wrapping with useCallback ensures stability if OriginalToastHook's addToast isn't memoized.
  const addToast = useCallback(
    (message: string, type: ToastType) => {
      originalAddToast(message, type);
    },
    [originalAddToast] // Dependency on originalAddToast
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <OriginalToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};