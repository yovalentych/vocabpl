"use client";

import { useEffect, useState } from "react";
import { Key, X } from "@phosphor-icons/react";
import { useLocale } from "@/components/LocaleProvider";
import { usePathname } from "next/navigation";
import { useAuthStatus } from "@/components/useAuthStatus";

type LastStatus = { status: "ok" | "error"; at: string };

type Provider = "pvs";

export default function ByokPanel() {
  const { isAuthenticated, isActive } = useAuthStatus();
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [statusConnected, setStatusConnected] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<LastStatus | null>(null);
  const [provider, setProvider] = useState<Provider>("pvs");

  useEffect(() => {
    if (!isAuthenticated) return;
    function hydrateLocal() {
      const stored = window.localStorage.getItem("byok_last_used");
      if (stored) setLastUsed(stored);
      const statusRaw = window.localStorage.getItem("byok_last_status");
      if (statusRaw) {
        const parsed = JSON.parse(statusRaw);
        if (parsed?.status && parsed?.at) setLastStatus(parsed);
      }
      setProvider("pvs");
      window.localStorage.setItem("ai_provider", "pvs");
    }
    hydrateLocal();
    function handleUsed() {
      hydrateLocal();
    }
    window.addEventListener("byok-used", handleUsed);
    window.addEventListener("byok-status", handleUsed);
    return () => {
      window.removeEventListener("byok-used", handleUsed);
      window.removeEventListener("byok-status", handleUsed);
    };
  }, [isAuthenticated, isActive]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setStatusConnected(isActive);
  }, [isAuthenticated, isActive]);

  if (!isAuthenticated) return null;

  const connectedLabel = statusConnected ? t.cabinet.aiStatusConnected : t.cabinet.aiStatusDisconnected;
  const pvsAvailable = isActive;
  const onClass = pathname.startsWith("/class");
  const panelLeft = onClass ? "calc(1.5rem + 72px)" : "1.5rem";

  return (
    <div
      className="fixed z-40 pointer-events-none hidden"
      style={{ left: panelLeft, bottom: "calc(var(--footer-height,96px) + 16px)" }}
    >
      <div
        className={`mb-3 w-[360px] rounded-3xl border border-ink/10 bg-paper/95 shadow-xl transition-all duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="flex">
          <div className="flex w-14 flex-col items-center gap-3 border-r border-ink/10 bg-paper/70 px-3 py-4">
            <span className="rounded-2xl border border-ink/10 bg-paper px-2 py-2 text-[10px] uppercase text-ink/50">
              {t.cabinet.aiPanelLabel}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-paper">
              <Key size={16} weight="bold" />
            </span>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{t.cabinet.aiTitle}</h3>
                <p className="mt-2 text-xs text-ink/60">{t.cabinet.aiSubtitle}</p>
                <p className="mt-2 text-xs text-ink/50">{t.cabinet.aiBillingNote}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink/60"
                aria-label={t.common.close}
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">{t.cabinet.aiKeysLabel}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{t.cabinet.aiPvsKey}</p>
                        <p className="text-[10px] text-ink/50">
                          {pvsAvailable ? t.cabinet.aiPvsActive : t.cabinet.aiPvsUnavailable}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            pvsAvailable ? "bg-moss/20 text-moss" : "bg-ink/10 text-ink/50"
                          }`}
                        >
                          {pvsAvailable ? t.cabinet.aiStatusOn : t.cabinet.aiStatusOff}
                        </span>
                        <button
                          onClick={() => {
                            if (!pvsAvailable) return;
                            setProvider("pvs");
                            window.localStorage.setItem("ai_provider", "pvs");
                          }}
                          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] min-w-[72px] ${
                            provider === "pvs"
                              ? "bg-ink text-paper"
                              : "border border-ink/10 text-ink/50"
                          } ${pvsAvailable ? "" : "opacity-40"}`}
                        >
                          {provider === "pvs" ? t.cabinet.aiSelected : t.cabinet.aiSelect}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-ink/40">
                    {t.cabinet.aiLastUsed} {lastUsed ? new Date(lastUsed).toLocaleString() : connectedLabel}
                  </p>
                  <p className="mt-1 text-[10px] text-ink/40">
                    {t.cabinet.aiLastRequest}{" "}
                    {lastStatus
                      ? `${new Date(lastStatus.at).toLocaleString()} · ${
                          lastStatus.status === "ok" ? t.cabinet.aiLastRequestOk : t.cabinet.aiLastRequestErr
                        }`
                      : t.cabinet.aiNeverUsed}
                  </p>
                </div>
              </div>
            </div>


            <p className="mt-3 text-[10px] text-ink/50">{t.cabinet.aiExtra}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-paper/95 shadow-soft pointer-events-auto"
        aria-label={t.cabinet.aiPanelLabel}
      >
        <Key size={18} weight="bold" />
        <span
          className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border border-paper ${
            provider === "pvs" && pvsAvailable ? "bg-moss" : "bg-ink/20"
          }`}
        />
      </button>
    </div>
  );
}
