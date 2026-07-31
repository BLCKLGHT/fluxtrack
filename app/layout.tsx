import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { appUrl } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "FluxTrack | Laboratory sample tracking", template: "%s | FluxTrack" },
  description: "Fast, traceable laboratory sample issue reporting for process operators.",
  applicationName: "FluxTrack",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "FluxTrack", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  openGraph: {
    title: "FluxTrack",
    description: "Evidence captured at the moment it matters.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FluxTrack laboratory sample control" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxTrack",
    description: "Evidence captured at the moment it matters.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#176b4d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        {children}
        <Script id="service-worker" strategy="afterInteractive">
          {`if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js")); }`}
        </Script>
      </body>
    </html>
  );
}
