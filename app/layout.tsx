import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCL Replacement Spot Race",
  description: "Live multi-league dashboard for UCL replacement spot contenders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          defer
          src="https://umami.cvejicm.net/script.js"
          data-website-id="bf4ccc96-0778-4e63-8621-adc3d18d9a7e"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
