import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore
import "./globals.css";
import ClientNavbar from "@/components/ClientNavbar";
import { Toaster } from "react-hot-toast"; // Add this import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncSketch - Collaborative Drawing",
  description: "Real-time collaborative drawing application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        <ClientNavbar />
        {children}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#10B981', // Green for success (matches Tailwind)
              color: '#fff',
              fontFamily: 'var(--font-geist-sans)', // Use your Geist font
            },
            success: {
              style: {
                background: '#10B981',
                color: '#fff',
              },
            },
          }} 
        /> {/* Add this: Global toasts with theme */}
      </body>
    </html>
  );
}