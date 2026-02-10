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
              <div className="flex flex-1 flex-col min-h-[calc(100vh-var(--header-height,88px))] pb-[calc(var(--footer-height,96px)+24px)]">
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
              <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3">
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
