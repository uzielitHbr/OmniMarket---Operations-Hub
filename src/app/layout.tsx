import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniMarket Operations Hub",
  description: "E-commerce real-time operations and analytics hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
