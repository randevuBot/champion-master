import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-orbitron" }); // Note: Orbitron only supports latin, no latin-ext available
const rajdhani = Rajdhani({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-rajdhani" });

export const metadata = {
  title: "ChampionMaster - Futbol Menajerlik",
  description: "Efsanevi Menajerlik Deneyimi",
};

import { ClientLayout } from "@/components/shared/ClientLayout";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} antialiased dark`}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
