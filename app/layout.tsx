import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCL Replacement Spot Race",
  description: "Live multi-league dashboard for UCL replacement spot contenders",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="border-t border-white/10 bg-slate-950/90 px-4 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Unofficial: not affiliated with UEFA, clubs, or leagues.</p>
            <a
              href="https://www.cvejicm.net/#contact"
              target="_blank"
              rel="noreferrer"
              className="text-sky-300 transition hover:text-sky-200"
            >
              Contact
            </a>
          </div>
        </footer>
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
