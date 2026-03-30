import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liteparse",
  description: "Upload a document and parse it with Liteparse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
