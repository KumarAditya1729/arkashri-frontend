import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bandhan Vatika | Banquet Hall",
  description: "Premium Banquet Hall for Weddings, Events, and Celebrations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-slate-900 bg-gray-50`}>
        <AuthGuard>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </AuthGuard>
      </body>
    </html>
  );
}

