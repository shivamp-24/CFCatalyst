import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const handleDismiss = (id) => {
    // Prevent default behavior to avoid any bubbling issues
    dismiss(id);
  };

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-[420px] w-full">
      {toasts.map(function ({
        id,
        title,
        description,
        variant,
        open,
        ...props
      }) {
        return (
          <div
            key={id}
            className={`${
              variant === "destructive"
                ? "bg-red-500 text-white"
                : "bg-white text-gray-900"
            } rounded-md shadow-lg p-4 relative ${
              open
                ? "animate-slide-in-from-right"
                : "animate-slide-out-to-right"
            }`}
            {...props}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {title && <div className="font-medium">{title}</div>}
                {description && (
                  <div className="text-sm mt-1">{description}</div>
                )}
              </div>
              <button
                onClick={() => handleDismiss(id)}
                className={`ml-4 p-1 rounded-full hover:bg-black/10 ${
                  variant === "destructive" ? "text-white" : "text-gray-500"
                }`}
                aria-label="Close toast"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
