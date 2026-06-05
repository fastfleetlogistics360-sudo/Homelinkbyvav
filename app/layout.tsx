import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { APP_NAME, TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: TAGLINE
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
