import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Denials Doctor - AI-Powered Healthcare Denial Management",
  description: "AI-powered denial management platform for healthcare RCM. Analyze denials, generate appeals, track payer behavior, and prevent future denials across all medical specialties.",
  keywords: ["denial management", "denials doctor", "RCM", "healthcare", "AI", "appeals", "medical coding", "revenue cycle", "denialsdoctor.com"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Denials Doctor - AI-Powered Healthcare Denial Management",
    description: "AI-powered denial management platform for healthcare RCM",
    url: "https://denialsdoctor.com",
    siteName: "Denials Doctor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Denials Doctor - AI-Powered Healthcare Denial Management",
    description: "AI-powered denial management platform for healthcare RCM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
