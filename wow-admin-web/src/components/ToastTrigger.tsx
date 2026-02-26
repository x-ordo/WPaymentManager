"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

interface ToastTriggerProps {
  message: string;
  type?: "success" | "error";
}

/**
 * 서버 컴포넌트에서 특정 조건 시 Toast를 띄우기 위한 트리거 컴포넌트
 */
export function ToastTrigger({ message, type = "error" }: ToastTriggerProps) {
  useEffect(() => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }, [message, type]);

  return null;
}
