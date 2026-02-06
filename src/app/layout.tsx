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
import { LocaleProvider } from "@/components/LocaleProvider";
import { getServerLocale } from "@/lib/i18n-server";
import FooterHotkeys from "@/components/FooterHotkeys";
import { AuthStatusProvider } from "@/components/useAuthStatus";

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
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff4ea,_#f6e6d8_55%,_#e8d6c6)] flex flex-col">
              <NavBar />
              <QuickAddWord />
              <NotesManager />
              <div className="flex-1">{children}</div>
              <Footer />
              <div className="mx-auto w-full max-w-6xl px-6 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink/40">
                  <FooterHotkeys />
                  <div className="flex flex-wrap items-center gap-3">
                    <FloatingNotesButton />
                    <FloatingAddWordButton />
                  </div>
                </div>
              </div>
              <CookieConsent />
            </div>
          </AuthStatusProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
