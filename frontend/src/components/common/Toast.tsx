// src/components/common/Toast.tsx (สร้างไฟล์ใหม่)
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const baseClasses =
    "p-4 rounded-md shadow-lg text-white mb-2 flex justify-between items-center";
  const typeClasses = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500 text-black",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-4 text-lg font-semibold hover:opacity-75"
      >
        ×
      </button>
    </div>
  );
};

// Hook to manage toast messages
let toastIdCounter = 0;
const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = toastIdCounter++;
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};

// Toast Container Component
export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}> = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-full max-w-xs sm:max-w-sm">
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

export default useToast;
