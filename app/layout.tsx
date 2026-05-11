import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Arkashri | AI Audit OS",
  description: "AI-powered audit automation, evidence, risk, compliance and reporting platform.",
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
