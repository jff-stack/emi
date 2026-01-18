import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * @description Inter font for clean medical UI typography
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * @description Emi - AI Intake Companion for Healthcare
 */
export const metadata: Metadata = {
  title: "Emi | AI Intake Companion",
  description: "Intelligent medical intake powered by voice AI, real-time vitals monitoring, and clinical synthesis",
  keywords: ["healthcare", "AI", "medical intake", "voice assistant", "vitals monitoring"],
};

/**
 * @description Root layout with dark mode enabled by default
 * Implements a healthcare aesthetic using Slate/Zinc color palette
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
