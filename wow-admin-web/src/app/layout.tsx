import type { Metadata } from "next";
import { ToastContainer } from "@/components/ToastContainer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreativePaymentManager",
  description: "Payment Manager Intranet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-base-100">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
