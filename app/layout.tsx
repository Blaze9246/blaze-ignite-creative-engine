import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Blaze Ignite Creative Engine", description: "Internal creative testing engine." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen">{children}</body></html>);
}
