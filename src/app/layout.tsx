import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
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
import ClassSidebar from "@/components/ClassSidebar";

const displayFont = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Polish Vocab Studio",
  description: "Learn Polish vocabulary with focused study decks."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <html lang={locale}>
      <body className={`${displayFont.variable} ${bodyFont.variable} bg-paper text-ink antialiased`}>
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
                <div className="flex flex-1">
                  <ClassSidebar />
                  <div className="min-w-0 flex-1">{children}</div>
                </div>
                <div className="mt-auto">
                  <FooterObserver>
                    <Footer />
                  </FooterObserver>
                </div>
              </div>
              <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3">
                <FloatingNotesButton />
                <FloatingAddWordButton />
              </div>
              <CookieConsent />
            </div>
          </AuthStatusProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
