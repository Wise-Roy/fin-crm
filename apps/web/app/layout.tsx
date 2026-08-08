import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FinCRM — Company Secretary Suite",
  description:
    "Purpose-built CRM for Company Secretary firms. Manage ROC filings, client relationships, team workload, and reimbursements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-sans, 'DM Sans', sans-serif)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
