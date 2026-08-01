import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allah'ın Şişkosu",
  description: "AI-powered calorie and nutrition tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
