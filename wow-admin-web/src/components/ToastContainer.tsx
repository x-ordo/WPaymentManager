"use client";

import { useEffect, useState } from "react";
import { toast as toastStore } from "@/lib/toast";

export function ToastContainer() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    return toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-top toast-end z-[9999] p-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`alert ${
            t.type === "success" ? "alert-success" : 
            t.type === "error" ? "alert-error" : 
            t.type === "warning" ? "alert-warning" : "alert-info"
          } shadow-lg border border-base-content/10 animate-in fade-in slide-in-from-right-5 duration-300`}
        >
          <div className="flex items-center gap-2">
            {t.type === "success" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {t.type === "error" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <span className="font-semibold text-sm tracking-tight">{t.message}</span>
          </div>
          <button 
            onClick={() => toastStore.remove(t.id)}
            className="btn btn-ghost btn-xs btn-circle ml-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
