import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://dadanghamdani.my.id";

export const metadata: Metadata = {
  title: "POS Kasir Sembako - Aplikasi Kasir Toko Sembako Cloud-Based",
  description:
    "Aplikasi kasir modern untuk toko sembako, warung, dan toko kelontong. Scan barcode, multi metode bayar (Tunai/QRIS/Transfer/Tempo), laporan real-time. Sekali bayar, milik selamanya. Mulai Rp 150.000.",
  keywords: [
    "pos kasir",
    "aplikasi kasir",
    "kasir toko sembako",
    "pos sembako",
    "aplikasi kasir gratis",
    "kasir online",
    "point of sale indonesia",
    "kasir cloud",
    "kasir qris",
  ],
  authors: [{ name: "Dan Khamdan" }],
  creator: "Dan Khamdan",
  publisher: "Dan Khamdan",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "POS Kasir Sembako - Aplikasi Kasir Cloud-Based",
    description:
      "Kelola toko sembako lebih cepat, akurat, & modern. Scan barcode, multi metode bayar, laporan real-time. Sekali bayar, milik selamanya. Mulai Rp 150.000.",
    url: SITE_URL,
    siteName: "POS Kasir Sembako",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POS Kasir Sembako - Aplikasi Kasir Cloud-Based",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "POS Kasir Sembako - Aplikasi Kasir Cloud-Based",
    description:
      "Kelola toko sembako lebih cepat & akurat. Sekali bayar, milik selamanya. Mulai Rp 150.000.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
