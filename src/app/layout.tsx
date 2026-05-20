import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Denials Doctor | AI-Powered Denial Management & Revenue Recovery",
  description:
    "Turn denials into revenue. 6 functional AI agents — each with a defined job, strict scope boundaries, and anti-hallucination guardrails — analyze, fix, and appeal your denied claims 80% faster.",
  keywords: [
    "Denials Doctor",
    "denial management",
    "revenue cycle management",
    "RCM",
    "Healthcare AI",
    "Claim Denials",
    "Appeal Letters",
    "Medical Billing",
    "HIPAA Compliance",
    "FHIR",
    "ICD-10",
    "CPT",
  ],
  authors: [{ name: "Denials Doctor" }],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Denials Doctor | AI-Powered Denial Management",
    description:
      "Turn denials into revenue with 6 functional AI agents. Each agent has a defined scope and anti-hallucination guardrails. 80% faster processing, 25-40% higher appeal success.",
    url: "https://denialsdoctor.com",
    siteName: "Denials Doctor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Denials Doctor | AI-Powered Denial Management",
    description:
      "Turn denials into revenue with 6 functional AI agents and anti-hallucination guardrails.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
