import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ScrrblIX",
  description: "Draw, guess, and have fun!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} antialiased`}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
        <Toaster richColors position="top-center" theme="light" />
      </body>
    </html>
  );
}
