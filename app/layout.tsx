import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebox from "./components/sidebox";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import Script from "next/script";
import TranslationProvider from "../components/TranslationProvider";
import LanguageLoader from "../components/LanguageLoader";
import { cookies } from "next/headers";
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
  title: "Fair-note",
  description: "Your notes, your way.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fair-note",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="Fair-note" />
        <meta property="og:description" content="Capture inspiration, craft ideas, and let your notes shine" />
        <meta property="og:image" content="/static/images/default4.jpg" />
        <meta property="og:type" content="website" />
        {/* <meta property="og:url" content="https://yourdomain.com" /> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fair-note" />
        <meta name="twitter:description" content="Capture inspiration, craft ideas, and let your notes shine" />
        <meta name="twitter:image" content="/static/images/default4.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] no-scrollbar circularcursor
  `}
      >
        <Script
          src="https://pay.google.com/gp/p/js/pay.js"
          strategy="afterInteractive" // Carrega o script após a interação inicial
        />
        <ServiceWorkerRegistration />
        <TranslationProvider locale={lang}>
          <LanguageLoader>
            <AuthProvider>
              <ThemeProvider>
                <div className="flex flex-col md:flex-row min-h-screen  ">
                  <div className="flex-1 md:mr-72 flex flex-col ">
                    {/* <Profile /> */}
                    {children}
                  </div>

                  <Sidebox />
                </div>
              </ThemeProvider>
            </AuthProvider>
          </LanguageLoader>
        </TranslationProvider>
      </body>
    </html>
  );
}
