import type { Metadata } from "next";
import "./globals.css";
import { AppBackButton } from "@/components/app-back-button";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { APP_NAME, TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HomeLink",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/images/homelink-logo.png",
    apple: "/images/homelink-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppBackButton />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
