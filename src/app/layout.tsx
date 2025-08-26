import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Can Editor (Original)",
  description: "Standalone 3D soda can label editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
