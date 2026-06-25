import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import PwaRegister from "../components/PwaRegister";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "VossTaxi Booking",
  description: "Bestill taxi i Voss og omegn",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VossTaxi Booking",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#ffcc00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* History Icon */}
        <a href="/history" className="fixed top-4 right-4 text-white hover:text-amber-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </a>
        <PwaRegister />
      </body>
    </html>
  );
}
