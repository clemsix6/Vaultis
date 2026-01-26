import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Header, Footer } from "@/components/layout";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaultis | Tokenisation de Montres de Luxe",
  description:
    "Investissez dans les montres de luxe grâce à la tokenisation. Propriété fractionnée, trading sécurisé sur Base.",
  keywords: ["montre", "luxe", "tokenisation", "NFT", "blockchain", "Base", "investissement"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Vaultis | Tokenisation de Montres de Luxe",
    description: "Investissez dans les montres de luxe grâce à la tokenisation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030303]`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
