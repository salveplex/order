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
    icon: "/logo2.png",
    apple: "/logo2.png",
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
        <PwaRegister />
      </body>
    </html>
  );
}
