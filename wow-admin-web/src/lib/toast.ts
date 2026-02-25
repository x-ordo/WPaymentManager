type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: ToastListener[] = [];
let nextId = 0;

export const toast = {
  subscribe(listener: ToastListener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  show(message: string, type: ToastType = "info") {
    const id = nextId++;
    toasts = [...toasts, { id, message, type }];
    listeners.forEach((l) => l(toasts));

    // 4초 후 자동 삭제
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  },

  success(msg: string) { this.show(msg, "success"); },
  error(msg: string) { this.show(msg, "error"); },
  
  remove(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(toasts));
  },
};
