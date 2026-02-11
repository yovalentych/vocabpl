"use client";

import { useEffect, useState } from "react";
import { Word } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";

export default function DeckBrowser() {
  const { t } = useLocale();
  const [type, setType] = useState<"verbs" | "adverbs" | "adjectives">("verbs");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("type", type);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/words?${params.toString()}`);
      const data = await res.json();
      if (mounted) {
        setItems(data.items || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [type, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {[
            { id: "verbs", label: t.deck.verbs },
            { id: "adverbs", label: t.deck.adverbs },
            { id: "adjectives", label: t.deck.adjectives }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setType(option.id as "verbs" | "adverbs" | "adjectives")}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                type === option.id
                  ? "bg-ink text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.common.search}
          className="w-full sm:min-w-[220px] sm:flex-1 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm"
        />
      </div>

      {loading ? (
        <Loader label={t.common.loading} />
      ) : (
        <div className="grid gap-4 sm:gap-4 pb-8">
          {items.map((word) => (
            <div key={word.id} className="rounded-3xl border-2 border-ink/10 bg-paper/80 p-5 sm:p-4 shadow-soft transition-all active:scale-[0.98] hover:border-ink/15 hover:shadow-md">
              <div className="flex items-start sm:items-center justify-between gap-4 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-lg font-bold sm:font-semibold truncate leading-tight">{word.pl}</p>
                  <p className="text-base sm:text-sm text-ink/60 mt-1.5 sm:mt-0.5 font-medium sm:font-normal">{word.uk}</p>
                </div>
                <span className="flex-shrink-0 rounded-full border-2 border-ink/20 px-3 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-xs uppercase tracking-[0.2em] text-ink/50 font-bold sm:font-semibold">
                  {word.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
