"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Star } from "@phosphor-icons/react";
import { renderSimpleMarkdown } from "@/components/markdown";
import { DiffView } from "@/components/diff";

type Submission = {
  id: string;
  entryId: string;
  entryNumber: number;
  status: "pending" | "reviewed";
  comment?: string;
  rating?: number | null;
  issues?: string[];
  repeats?: string[];
  praise?: string;
  improve?: string;
  focus?: { grammar?: boolean; vocab?: boolean; style?: boolean };
  reaction?: string;
  correctedText?: string;
  clarificationRequested?: boolean;
  clarificationMessage?: string;
  clarificationReply?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  entrySnapshot?: {
    formattedText?: string;
    totalPoints?: number;
  };
};

export default function MessagesClient() {
  const { t } = useLocale();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "reviewed" | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/messages");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!mounted) return;
      setItems(data.submissions || []);
      setActiveId(data.submissions?.[0]?.id || null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((item) => item.status === tab);
  }, [items, tab]);

  const active = filtered.find((item) => item.id === activeId) || filtered[0] || null;

  async function requestClarification(item: Submission) {
    setRequestingId(item.id);
    const message = window.prompt(t.messages.clarificationPrompt) || "";
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, message })
    });
    setRequestingId(null);
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, clarificationRequested: true } : entry
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t.messages.title}</h1>
          <p className="mt-2 text-sm text-ink/60">{t.messages.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {["pending", "reviewed", "all"].map((key) => (
            <button
              key={key}
              onClick={() => {
                setTab(key as typeof tab);
                setActiveId(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                tab === key ? "bg-ink text-paper" : "border border-ink/20 text-ink"
              }`}
            >
              {key === "pending" ? t.messages.pending : key === "reviewed" ? t.messages.reviewed : t.messages.all}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          {loading ? (
            <p className="text-sm text-ink/60">{t.common.loading}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink/60">{t.messages.empty}</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    item.id === active?.id
                      ? "border-ink bg-ink/5"
                      : "border-ink/10 bg-paper/70 hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {t.workbook.entry} #{item.entryNumber}
                      </p>
                      <p className="text-xs text-ink/50">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        item.status === "reviewed"
                          ? "bg-moss/20 text-moss"
                          : "bg-ink/10 text-ink/70"
                      }`}
                    >
                      {item.status === "reviewed" ? t.messages.reviewed : t.messages.pending}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          {!active ? (
            <p className="text-sm text-ink/60">{t.messages.empty}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {t.workbook.entry} #{active.entryNumber}
                  </p>
                  <p className="text-xs text-ink/50">{new Date(active.createdAt).toLocaleString()}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active.status === "reviewed"
                      ? "bg-moss/20 text-moss"
                      : "bg-ink/10 text-ink/70"
                  }`}
                >
                  {active.status === "reviewed" ? t.messages.reviewed : t.messages.pending}
                </span>
              </div>

              {active.rating ? (
                <div className="flex items-center gap-1 text-terracotta">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const value = idx + 1;
                    return (
                      <Star key={value} size={18} weight={value <= (active.rating ?? 0) ? "fill" : "regular"} />
                    );
                  })}
                </div>
              ) : null}

              {active.reaction ? <div className="text-2xl">{active.reaction}</div> : null}

              <div className="grid gap-3 md:grid-cols-2">
                {active.praise ? (
                  <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.praise}</p>
                    <p className="mt-2 text-sm text-ink/80">{active.praise}</p>
                  </div>
                ) : null}
                {active.improve ? (
                  <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.improve}</p>
                    <p className="mt-2 text-sm text-ink/80">{active.improve}</p>
                  </div>
                ) : null}
              </div>

              {active.issues?.length ? (
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.issues}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
                    {active.issues.map((issue, idx) => (
                      <li key={`${active.id}-issue-${idx}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {active.repeats?.length ? (
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.repeats}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {active.repeats.map((word, idx) => (
                      <span key={`${active.id}-rep-${idx}`} className="rounded-full border border-ink/10 px-3 py-1 text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {active.focus && (active.focus.grammar || active.focus.vocab || active.focus.style) ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {active.focus.grammar && (
                    <span className="rounded-full border border-ink/10 px-3 py-1">{t.messages.focusItems.grammar}</span>
                  )}
                  {active.focus.vocab && (
                    <span className="rounded-full border border-ink/10 px-3 py-1">{t.messages.focusItems.vocab}</span>
                  )}
                  {active.focus.style && (
                    <span className="rounded-full border border-ink/10 px-3 py-1">{t.messages.focusItems.style}</span>
                  )}
                </div>
              ) : null}

              {active.comment ? (
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.comment}</p>
                  <div className="mt-2">{renderSimpleMarkdown(active.comment)}</div>
                </div>
              ) : (
                <p className="text-sm text-ink/60">{t.messages.noComment}</p>
              )}

              {active.correctedText ? (
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.correctedText}</p>
                  <div className="mt-3">
                    <DiffView
                      before={active.entrySnapshot?.formattedText || ""}
                      after={active.correctedText || ""}
                    />
                  </div>
                </div>
              ) : null}

              {active.entrySnapshot?.formattedText && (
                <pre className="whitespace-pre-wrap rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
                  {active.entrySnapshot.formattedText}
                </pre>
              )}

              {active.status === "reviewed" && !active.clarificationRequested && (
                <button
                  onClick={() => requestClarification(active)}
                  disabled={requestingId === active.id}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                >
                  {requestingId === active.id ? t.common.loading : t.messages.askMore}
                </button>
              )}
              {active.clarificationRequested && (
                <p className="text-xs text-ink/50">{t.messages.clarificationSent}</p>
              )}
              {active.clarificationReply && (
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.clarificationReply}</p>
                  <p className="mt-2 text-sm text-ink/80">{active.clarificationReply}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
