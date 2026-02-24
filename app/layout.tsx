import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCL Replacement Spot Race",
  description: "Live multi-league dashboard for UCL replacement spot contenders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
