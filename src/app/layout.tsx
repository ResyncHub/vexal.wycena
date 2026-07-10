import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wyceny Lamele",
  description: "Automatyczne wyceny lameli aluminiowych (shutters) w PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 font-sans">{children}</body>
    </html>
  );
}
