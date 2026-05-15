import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "A1 Group — We Build Brands That Dominate",
  description:
    "A1 Group is a full-service marketing agency specializing in social media management, content production, paid advertising, branding, web design, and AI integration.",
  keywords: [
    "marketing agency",
    "social media management",
    "content production",
    "branding",
    "AI integration",
    "A1 Group",
  ],
  openGraph: {
    title: "A1 Group — We Build Brands That Dominate",
    description:
      "Full-service marketing agency helping businesses grow through content, strategy, and AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
