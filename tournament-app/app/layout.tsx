import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Tournament App",
  description: "Tournament management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <Navbar />

        {children}
      </body>
    </html>
  );
}