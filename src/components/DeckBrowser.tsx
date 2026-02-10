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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {[
          { id: "verbs", label: t.deck.verbs },
          { id: "adverbs", label: t.deck.adverbs },
          { id: "adjectives", label: t.deck.adjectives }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setType(option.id as "verbs" | "adverbs" | "adjectives")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === option.id
                ? "bg-ink text-paper"
                : "border border-ink/20 text-ink hover:bg-ink/5"
            }`}
          >
            {option.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.common.search}
          className="min-w-[220px] flex-1 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm"
        />
      </div>

      {loading ? (
        <Loader label={t.common.loading} />
      ) : (
        <div className="grid gap-4">
          {items.map((word) => (
            <div key={word.id} className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{word.pl}</p>
                  <p className="text-sm text-ink/60">{word.uk}</p>
                </div>
                <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
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
