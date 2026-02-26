"use client";

import { useEffect, useState } from "react";

export function KSTClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // UTC 시간에 9시간을 더해 KST 계산
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + kstOffset);
      
      const formatted = kstDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      setTime(formatted);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-5 w-48 bg-base-200 animate-pulse rounded" />;

  return (
    <div className="flex items-center gap-2 text-base-content/50">
      <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
      <span className="tracking-tight text-sm uppercase font-medium">KST</span>
      <span className="text-sm tracking-tight font-bold">{time}</span>
    </div>
  );
}
