import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import QuickAddWord from "@/components/QuickAddWord";
import FloatingNotesButton from "@/components/FloatingNotesButton";
import FloatingAddWordButton from "@/components/FloatingAddWordButton";
import CookieConsent from "@/components/CookieConsent";
import NotesManager from "@/components/NotesManager";
import Footer from "@/components/Footer";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getServerLocale } from "@/lib/i18n-server";
import { AuthStatusProvider } from "@/components/useAuthStatus";
import ClassFloatingNav from "@/components/ClassFloatingNav";
import ByokPanel from "@/components/ByokPanel";
import BetaDisclaimer from "@/components/BetaDisclaimer";
import StructuredData, {
  getWebSiteSchema,
  getOrganizationSchema,
  getWebApplicationSchema,
  getCourseSchema
} from "@/components/StructuredData";

const DEFAULT_SITE_URL = "https://www.vocabpl.uno";

function getSiteUrl() {
  const envUrl =
    process.env.APP_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_SITE_URL;
  return envUrl.replace(/\/+$/, "");
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Polish Vocab Studio — вивчення польської мови онлайн",
    template: "%s | Polish Vocab Studio"
  },
  description:
    "Безкоштовний тренажер польської мови: словник, AI вправи, тести, читання. Вчи польську лексику ефективно з Polish Vocab Studio.",
  applicationName: "Polish Vocab Studio",
  keywords: [
    "польська мова",
    "вивчення польської",
    "nauka polskiego",
    "polski słownik",
    "польський словник",
    "AI вправи польська",
    "тести з польської",
    "Polish Vocab Studio"
  ],
  openGraph: {
    type: "website",
    title: "Polish Vocab Studio — вивчення польської мови онлайн",
    description:
      "Безкоштовний тренажер польської мови: словник, AI вправи, тести, читання.",
    siteName: "Polish Vocab Studio",
    locale: "uk_UA",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "Polish Vocab Studio — тренажер польської мови"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Polish Vocab Studio — вивчення польської мови онлайн",
    description:
      "Безкоштовний тренажер польської мови: словник, AI вправи, тести, читання.",
    images: ["/og.svg"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon-pvs-C-ai-apple-touch-icon.png"
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  const siteUrl = getSiteUrl();

  return (
    <html lang={locale}>
      <head>
        <StructuredData data={getWebSiteSchema(siteUrl)} />
        <StructuredData data={getOrganizationSchema(siteUrl)} />
        <StructuredData data={getWebApplicationSchema(siteUrl)} />
        <StructuredData data={getCourseSchema(siteUrl)} />
      </head>
      <body className="bg-paper text-ink antialiased">
        <LocaleProvider initialLocale={locale}>
          <AuthStatusProvider>
            <div
              className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff4ea,_#f6e6d8_55%,_#e8d6c6)] flex flex-col"
              style={{ "--header-height": "88px" } as React.CSSProperties}
            >
              <NavBar />
              <QuickAddWord />
              <NotesManager />
              <div className="flex flex-1 flex-col">
                <main className="flex flex-1 min-h-0 pb-6">
                  <ClassFloatingNav />
                  <div className="min-w-0 flex-1">{children}</div>
                </main>
              </div>
              <Footer />
              <div className="fixed bottom-6 left-4 right-4 z-40 flex items-stretch gap-3 sm:left-auto sm:right-6 sm:flex-col sm:items-end">
                <FloatingNotesButton />
                <FloatingAddWordButton />
              </div>
              <ByokPanel />
              <BetaDisclaimer />
              <CookieConsent />
            </div>
          </AuthStatusProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
