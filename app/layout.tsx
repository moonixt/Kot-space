import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebox from "./components/sidebox";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import TranslationProvider from "../components/TranslationProvider";
import LanguageLoader from "../components/LanguageLoader";
import { cookies } from "next/headers";
import ClientLayout from "./components/ClientLayout";
import CookieConsent from "./components/CookieConsent";
import { CookieConsentProvider } from "../lib/useCookieConsent";
// import Profile from "./profile/page";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Кot-space",
  description: "Capture inspiration, craft ideas, and let your notes shine.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kot-space",
  },
  openGraph: {
    title: "Kot-space",
    description: "Capture inspiration, craft ideas, and let your notes shine.",
    images: [
      {
        url: "https://fair-note.vercel.app/static/images/profilepic.jpg",
      },
    ],
    type: "website",
    url: "https://fair-note.vercel.app/",
    siteName: "Kot-space",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kot-space",
    description: "Capture inspiration, craft ideas, and let your notes shine",
    images: ["https://fair-note.vercel.app/static/images/profilepic.jpg"],
  },
};

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get preferred language from cookie or default to browser language
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const lang = langCookie?.value || "en"; // Default to English if no cookie

  return (
    <html lang={lang}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, height=device-height "
          charSet="UTF-8"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="title" content="Kot-space" />
        <meta
          property="description"
          content="Capture inspiration, craft ideas, and let your notes shine."
        />
        <meta property="og:title" content="Kot-space" />
        <meta
          property="og:description"
          content="Capture inspiration, craft ideas, and let your notes shine."
        />
        <meta
          property="og:image"
          content="https://fair-note.vercel.app/static/images/og.jpg"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fair-note.vercel.app/" />
        <meta property="og:site_name" content="Kot-space" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kot-space" />
        <meta
          name="twitter:description"
          content="Capture inspiration, craft ideas, and let your notes shine"
        />
        <meta
          name="twitter:image"
          content="https://fair-note.vercel.app/static/images/logo.png"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] no-scrollbar circularcursor
  `}
      >
        <ServiceWorkerRegistration />
        <TranslationProvider locale={lang}>
          <LanguageLoader>
            <AuthProvider>
              <ThemeProvider>
                <CookieConsentProvider>
                  <ClientLayout>
                    <div className="flex flex-col md:flex-row min-h-screen  ">
                      <div className="flex-1  flex flex-col ">
                        {/* <Profile /> */}
                        {children}
                      </div>

                      <Sidebox />
                    </div>
                  </ClientLayout>
                  <CookieConsent />
                </CookieConsentProvider>
              </ThemeProvider>
            </AuthProvider>
          </LanguageLoader>
        </TranslationProvider>
      </body>
    </html>
  );
}
