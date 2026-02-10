"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { renderSimpleMarkdown } from "@/components/markdown";
import { DiffView } from "@/components/diff";
import { Star } from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

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
  user?: { username: string; name?: string } | null;
  entrySnapshot?: {
    formattedText?: string;
    totalPoints?: number;
  };
};

const REACTIONS = ["👍", "🔥", "✨", "💡", "✅", "🙂", "💬"];

export default function AdminReviewsClient() {
  const { t } = useLocale();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<Submission | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [correctedDraft, setCorrectedDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState(0);
  const [praiseDraft, setPraiseDraft] = useState("");
  const [improveDraft, setImproveDraft] = useState("");
  const [issuesDraft, setIssuesDraft] = useState("");
  const [repeatsDraft, setRepeatsDraft] = useState("");
  const [focusDraft, setFocusDraft] = useState({ grammar: false, vocab: false, style: false });
  const [reactionDraft, setReactionDraft] = useState("");
  const [clarificationReplyDraft, setClarificationReplyDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = filter === "all" ? "" : `?status=${filter}`;
    const res = await fetch(`/api/admin/reviews${params}`);
    const data = await res.json().catch(() => null);
    setItems(data?.submissions || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function openModal(item: Submission) {
    setActiveModal(item);
    setCommentDraft(item.comment || "");
    setRatingDraft(item.rating || 0);
    setPraiseDraft(item.praise || "");
    setImproveDraft(item.improve || "");
    setIssuesDraft((item.issues || []).join("\n"));
    setRepeatsDraft((item.repeats || []).join(", "));
    setFocusDraft({
      grammar: Boolean(item.focus?.grammar),
      vocab: Boolean(item.focus?.vocab),
      style: Boolean(item.focus?.style)
    });
    setReactionDraft(item.reaction || "");
    setCorrectedDraft(item.correctedText || item.entrySnapshot?.formattedText || "");
    setClarificationReplyDraft(item.clarificationReply || "");
  }

  function insertToken(token: string) {
    setCommentDraft((prev) => (prev ? `${prev}${token}` : token));
  }

  async function saveModal() {
    if (!activeModal) return;
    const issues = issuesDraft
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const repeats = repeatsDraft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: activeModal.id,
        comment: commentDraft,
        status: "reviewed",
        rating: ratingDraft || null,
        issues,
        repeats,
        praise: praiseDraft,
        improve: improveDraft,
        focus: focusDraft,
        reaction: reactionDraft,
        correctedText: correctedDraft,
        clarificationReply: clarificationReplyDraft
      })
    });
    setActiveModal(null);
    await load();
  }

  async function quickMarkReviewed(item: Submission) {
    setSavingId(item.id);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, comment: item.comment || "", status: "reviewed" })
    });
    setSavingId(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t.messages.adminTitle}</h1>
          <p className="mt-2 text-sm text-ink/60">{t.messages.adminSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {["pending", "reviewed", "all"].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                filter === key ? "bg-ink text-paper" : "border border-ink/20 text-ink"
              }`}
            >
              {key === "pending" ? t.messages.pending : key === "reviewed" ? t.messages.reviewed : t.messages.all}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        {loading ? (
          <Loader label={t.common.loading} />
        ) : items.length === 0 ? (
          <p className="text-sm text-ink/60">{t.messages.emptyAdmin}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {t.workbook.entry} #{item.entryNumber}
                      {item.user?.username ? ` · ${item.user.username}` : ""}
                    </p>
                    <p className="text-xs text-ink/50">{new Date(item.createdAt).toLocaleString()}</p>
                    {item.clarificationRequested && (
                      <p className="mt-1 text-xs text-terracotta">{t.messages.clarificationRequested}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "reviewed"
                          ? "bg-moss/20 text-moss"
                          : "bg-ink/10 text-ink/70"
                      }`}
                    >
                      {item.status === "reviewed" ? t.messages.reviewed : t.messages.pending}
                    </span>
                    <button
                      onClick={() => setExpanded((prev) => (prev === item.id ? null : item.id))}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                    >
                      {expanded === item.id ? t.common.hide : t.workbook.show}
                    </button>
                    <button
                      onClick={() => openModal(item)}
                      className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper"
                    >
                      {t.messages.openReview}
                    </button>
                    {item.status !== "reviewed" && (
                      <button
                        onClick={() => quickMarkReviewed(item)}
                        className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                      >
                        {savingId === item.id ? t.common.loading : t.messages.markReviewed}
                      </button>
                    )}
                  </div>
                </div>
                {expanded === item.id && (
                  <div className="mt-4 space-y-3">
                    {item.clarificationRequested && item.clarificationMessage ? (
                      <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.clarificationNote}</p>
                        <p className="mt-2 text-sm text-ink/80">{item.clarificationMessage}</p>
                      </div>
                    ) : null}
                    {item.entrySnapshot?.formattedText && (
                      <pre className="whitespace-pre-wrap rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
                        {item.entrySnapshot.formattedText}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{t.messages.reviewTitle}</h3>
                <p className="text-xs text-ink/50">
                  {t.workbook.entry} #{activeModal.entryNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                >
                  {t.common.close}
                </button>
                <button
                  onClick={saveModal}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {t.messages.saveReview}
                </button>
              </div>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto p-6">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.rating}</p>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const value = idx + 1;
                      const active = value <= ratingDraft;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRatingDraft(value)}
                          className="text-terracotta"
                        >
                          <Star size={22} weight={active ? "fill" : "regular"} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm text-ink/70">
                    {t.messages.praise}
                    <textarea
                      value={praiseDraft}
                      onChange={(event) => setPraiseDraft(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                      placeholder={t.messages.praisePlaceholder}
                    />
                  </label>
                  <label className="block text-sm text-ink/70">
                    {t.messages.improve}
                    <textarea
                      value={improveDraft}
                      onChange={(event) => setImproveDraft(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                      placeholder={t.messages.improvePlaceholder}
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm text-ink/70">
                    {t.messages.issues}
                    <textarea
                      value={issuesDraft}
                      onChange={(event) => setIssuesDraft(event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                      placeholder={t.messages.issuesPlaceholder}
                    />
                  </label>
                  <label className="block text-sm text-ink/70">
                    {t.messages.repeats}
                    <input
                      value={repeatsDraft}
                      onChange={(event) => setRepeatsDraft(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                      placeholder={t.messages.repeatsPlaceholder}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="text-ink/60">{t.messages.focus}</span>
                  {["grammar", "vocab", "style"].map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(focusDraft[key as keyof typeof focusDraft])}
                        onChange={(event) =>
                          setFocusDraft((prev) => ({
                            ...prev,
                            [key]: event.target.checked
                          }))
                        }
                      />
                      <span>{t.messages.focusItems[key as "grammar" | "vocab" | "style"]}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink/60">{t.messages.reaction}</span>
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setReactionDraft(emoji)}
                      className={`rounded-full border px-3 py-1 ${
                        reactionDraft === emoji ? "border-terracotta bg-terracotta/10" : "border-ink/10"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.formatting}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => insertToken("**bold**")}
                      className="rounded-full border border-ink/20 px-3 py-1"
                    >
                      {t.messages.bold}
                    </button>
                    <button
                      onClick={() => insertToken("*italic*")}
                      className="rounded-full border border-ink/20 px-3 py-1"
                    >
                      {t.messages.italic}
                    </button>
                    <button
                      onClick={() => insertToken("`code`")}
                      className="rounded-full border border-ink/20 px-3 py-1"
                    >
                      {t.messages.code}
                    </button>
                    <button
                      onClick={() => insertToken("\n- пункт")}
                      className="rounded-full border border-ink/20 px-3 py-1"
                    >
                      {t.messages.list}
                    </button>
                  </div>
                </div>

                <label className="block text-sm text-ink/70">
                  {t.messages.comment}
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                    placeholder={t.messages.commentPlaceholder}
                  />
                </label>

                <label className="block text-sm text-ink/70">
                  {t.messages.correctedText}
                  <textarea
                    value={correctedDraft}
                    onChange={(event) => setCorrectedDraft(event.target.value)}
                    rows={8}
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                    placeholder={t.messages.correctedPlaceholder}
                  />
                </label>

                {activeModal.clarificationRequested && (
                  <label className="block text-sm text-ink/70">
                    {t.messages.clarificationReply}
                    <textarea
                      value={clarificationReplyDraft}
                      onChange={(event) => setClarificationReplyDraft(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
                      placeholder={t.messages.clarificationReplyPlaceholder}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.preview}</p>
                  <div className="mt-3">{renderSimpleMarkdown(commentDraft)}</div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.messages.correctionsDiff}</p>
                  {activeModal.entrySnapshot?.formattedText ? (
                    <div className="mt-3">
                      <DiffView
                        before={activeModal.entrySnapshot?.formattedText || ""}
                        after={correctedDraft || ""}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-ink/50">{t.messages.noText}</p>
                  )}
                </div>
                {activeModal.entrySnapshot?.formattedText && (
                  <pre className="whitespace-pre-wrap rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
                    {activeModal.entrySnapshot.formattedText}
                  </pre>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
