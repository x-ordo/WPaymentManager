import { AlertCircle, CheckCircle, X } from 'lucide-react';

export interface ExportToastData {
  type: 'success' | 'error';
  message: string;
  filename?: string;
}

interface ExportToastProps {
  toast: ExportToastData | null;
  onClose: () => void;
}

export function ExportToast({ toast, onClose }: ExportToastProps) {
  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}
      role="alert"
      aria-live="polite"
    >
      {toast.type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{toast.message}</span>
        {toast.filename && (
          <span className="text-xs opacity-75">{toast.filename}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-full p-1 hover:bg-black/5 transition-colors"
        aria-label="알림 닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
