import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.agendaeapp.com"),
  title: "Agendaê | Agendamento Online",
  description: "Agendamento rápido e fácil de barbearia.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agendaê",
  },
  icons: {
    icon: "/simbol-logo.svg",
    apple: "/simbol-logo.svg",
  },
  openGraph: {
    title: "Agendaê | Agendamento Online",
    description: "Agendamento rápido e fácil de barbearia.",
    url: "https://www.agendaeapp.com",
    siteName: "Agendaê",
    images: [
      {
        url: "/ICON-PNG.png",
        width: 800,
        height: 600,
        alt: "Logo Agendaê",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agendaê | Agendamento Online",
    description: "Agendamento rápido e fácil de barbearia.",
    images: ["/ICON-PNG.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
