import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * @description Inter font for clean medical UI typography
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * @description Emi - AI Intake Companion for Healthcare
 */
export const metadata: Metadata = {
  title: "Emi | Virtual Triage & Intake",
  description: "Quality care, right around the corner. AI-powered virtual triage and medical intake.",
  keywords: ["healthcare", "AI", "medical intake", "virtual triage", "telemedicine"],
};

/**
 * @description Root layout with Trust & Triage aesthetic
 * Clean, professional healthcare interface
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
