import type { Metadata, Viewport } from "next";
import "./globals.css";

const themeBootstrap = `
  try {
    const theme = localStorage.getItem("eigenforge-theme") === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

export const metadata: Metadata = {
  title: "EIGENFORGE",
  description:
    "Forgez un espace vectoriel dans ce jeu incrémental d’algèbre linéaire pour les classes préparatoires MPSI et MP.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#edf2ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
