import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EIGENFORGE",
  description:
    "Forgez un espace vectoriel dans ce jeu incrémental d’algèbre linéaire pour les classes préparatoires MPSI et MP.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
