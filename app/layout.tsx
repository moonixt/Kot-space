import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Sidebox from "./components/sidebox";
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
  title: "Lynxky",
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
    title: "Lynxky",
  },
  openGraph: {
    title: "Lynxky",
    description: "Capture inspiration, craft ideas, and let your notes shine.",
    images: [
      {
        url: "/static/images/og.png",
      },
    ],
    type: "website",
    url: "/",
    siteName: "Lynxky",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lynxky",
    description: "Capture inspiration, craft ideas, and let your notes shine",
    images: ["/static/images/og.png"],
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
        <meta property="title" content="Lynxky" />
        <meta
          property="description"
          content="Capture inspiration, craft ideas, and let your notes shine."
        />
        <meta property="og:title" content="Lynxky" />
        <meta
          property="og:description"
          content="Capture inspiration, craft ideas, and let your notes shine."
        />
        <meta property="og:image" content="/static/images/og.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:site_name" content="Lynxky" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lynxky" />
        <meta
          name="twitter:description"
          content="Capture inspiration, craft ideas, and let your notes shine"
        />
        <meta name="twitter:image" content="/static/images/og.png" />
        <meta name="twitter:site" content="@lynxky" />
        <meta name="twitter:creator" content="@lynxky" />

        {/* Additional meta tags for better social media compatibility */}
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Lynxky - Capture your thoughts"
        />

        {/* WhatsApp specific meta tags */}
        <meta property="og:image:type" content="image/png" />
        <meta name="format-detection" content="telephone=no" />
        {/* Schema.org structured data for better search engine and messaging app compatibility */}
        <meta name="application-name" content="Lynxky" />
        <meta name="generator" content="Next.js" />
        <meta
          name="keywords"
          content="notes, productivity, writing, ideas, inspiration"
        />
        <meta name="author" content="Lynxky" />
        <meta name="creator" content="Lynxky" />
        <meta name="publisher" content="Lynxky" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Lynxky",
              description:
                "Capture inspiration, craft ideas, and let your notes shine.",
              image: "/static/images/og.png",
              url: "/",
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Web",
              browserRequirements: "Requires JavaScript. Requires HTML5.",
              permissions: "none",
            }),
          }}
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
                    <div className="flex  flex-col 2xl:flex-row min-h-screen  ">
                      <div className="flex-1  flex flex-col ">
                        {/* <Profile /> */}
                        {children}
                      </div>

                      {/* <Sidebox /> */}
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
