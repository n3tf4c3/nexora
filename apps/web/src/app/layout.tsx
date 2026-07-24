import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "Nexora",
  description: "Finanças pessoais, no seu ritmo.",
};

const scriptScriptAntiFlickerTema = `
  (function() {
    try {
      var salvo = localStorage.getItem('theme');
      if (salvo === 'light' || salvo === 'dark') {
        document.documentElement.classList.add(salvo);
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptScriptAntiFlickerTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
