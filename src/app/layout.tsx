import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ClientWrapper from "./components/ClientWrapper";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThinkDocs | Gestão da Qualidade",
  description: "Sistema de Gerenciamento de Documentos de Gestão da Qualidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={montserrat.className}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
