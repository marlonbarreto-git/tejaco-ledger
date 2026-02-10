import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TejaCo Ledger - Multi-Currency Balance Engine",
  description: "Cross-border remittance balance tracking and transaction timeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
