import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sentinelAppName, sentinelTagline } from "@sentinel/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${sentinelAppName} Web`,
  description: sentinelTagline
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
