import type { Metadata } from "next";
import "./globals.css";
import { AppBackButton } from "@/components/app-back-button";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { APP_NAME } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://homelinkbyvav.com.ng";
const siteDescription =
  "HomeLink by V-A.V connects home seekers with verified property agents for apartment requests, matches, messaging, secure Paystack payments, referrals, and agent subscriptions.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`
  },
  description: siteDescription,
  applicationName: APP_NAME,
  keywords: [
    "HomeLink by V-A.V",
    "Nigeria property technology",
    "apartment requests",
    "verified real estate agents",
    "Lagos apartments",
    "Paystack real estate payments"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: APP_NAME,
    description: siteDescription,
    url: "/",
    siteName: APP_NAME,
    images: [
      {
        url: "/images/homelink-logo.png",
        width: 512,
        height: 512,
        alt: APP_NAME
      }
    ],
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: siteDescription,
    images: ["/images/homelink-logo.png"]
  },
  robots: {
    index: true,
    follow: true
  },
  category: "real estate",
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
