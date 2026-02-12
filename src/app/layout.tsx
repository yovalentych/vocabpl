import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import QuickAddWord from "@/components/QuickAddWord";
import FloatingNotesButton from "@/components/FloatingNotesButton";
import FloatingAddWordButton from "@/components/FloatingAddWordButton";
import CookieConsent from "@/components/CookieConsent";
import NotesManager from "@/components/NotesManager";
import Footer from "@/components/Footer";
import FooterObserver from "@/components/FooterObserver";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getServerLocale } from "@/lib/i18n-server";
import { AuthStatusProvider } from "@/components/useAuthStatus";
import ClassFloatingNav from "@/components/ClassFloatingNav";
import ByokPanel from "@/components/ByokPanel";

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
  title: "Polish Vocab Studio",
  description: "Learn Polish vocabulary with focused study decks.",
  applicationName: "Polish Vocab Studio",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    title: "Polish Vocab Studio",
    description: "Learn Polish vocabulary with focused study decks.",
    siteName: "Polish Vocab Studio",
    url: "/"
  },
  twitter: {
    card: "summary",
    title: "Polish Vocab Studio",
    description: "Learn Polish vocabulary with focused study decks."
  },
  icons: {
    icon: "/favicon.ico"
  },
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
  return (
    <html lang={locale}>
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
              <div className="flex flex-1 flex-col min-h-[calc(100vh-var(--header-height,88px))] pb-32 sm:pb-[calc(var(--footer-height,96px)+24px)]">
                <main className="flex flex-1 min-h-0 pb-6">
                  <ClassFloatingNav />
                  <div className="min-w-0 flex-1">{children}</div>
                </main>
              </div>
              <FooterObserver>
                <div className="fixed bottom-0 left-0 right-0 z-40">
                  <Footer />
                </div>
              </FooterObserver>
              <div className="fixed bottom-24 left-4 right-4 z-40 flex items-stretch gap-3 sm:bottom-20 sm:left-auto sm:right-6 sm:flex-col sm:items-end">
                <FloatingNotesButton />
                <FloatingAddWordButton />
              </div>
              <ByokPanel />
              <CookieConsent />
            </div>
          </AuthStatusProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
