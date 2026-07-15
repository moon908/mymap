import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Premium Interactive Maps Dashboard",
  description: "A production-ready maps application featuring vector drawings, custom marker clusters, OSRM routes, and dark mode built with Next.js 15, React 19, and TomTom.",
  keywords: ["Maps", "Interactive Map", "Leaflet", "Next.js", "Zustand", "OSM", "OSRM", "GeoJSON", "Marker Clustering"],
  authors: [{ name: "Antigravity Engineering" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
