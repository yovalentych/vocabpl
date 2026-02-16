"use client";

import { useState } from "react";
import { Book, Lightning, Plus, Check } from "@phosphor-icons/react";
import { useReadingAI, type AIGlossaryWord } from "./hooks/useReadingAI";
import Loader from "@/components/ui/Loader";

interface ReadingGlossaryProps {
  text: string;
  level: string;
  locale?: string;
}

export default function ReadingGlossary({ text, level, locale = "uk" }: ReadingGlossaryProps) {
  const { glossary, loading, error, generateGlossary, clearGlossary } = useReadingAI();
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addingWord, setAddingWord] = useState<string | null>(null);

  async function handleGenerate() {
    await generateGlossary(text, level, locale);
  }

  async function handleAddWord(word: AIGlossaryWord) {
    if (addedWords.has(word.pl)) return;

    setAddingWord(word.pl);
    try {
      const res = await fetch("/api/user/words/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: word.pl, uk: word.uk })
      });

      if (res.ok) {
        setAddedWords(prev => new Set([...prev, word.pl]));
      }
    } catch (err) {
      console.error("Failed to add word:", err);
    } finally {
      setAddingWord(null);
    }
  }

  async function handleAddAll() {
    for (const word of glossary) {
      if (!addedWords.has(word.pl)) {
        await handleAddWord(word);
      }
    }
  }

  if (!glossary || glossary.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Book size={24} weight="duotone" className="text-gold" />
          <h3 className="text-xl font-semibold">AI Глосарій</h3>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Згенеруйте словник ключових слів з тексту
        </p>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader label="" />
              Генерую глосарій...
            </>
          ) : (
            <>
              <Lightning size={18} weight="fill" />
              Згенерувати глосарій (1 кредит)
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <p className="text-sm font-medium text-terracotta">{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
            >
              Спробувати ще раз
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Book size={24} weight="duotone" className="text-gold" />
          <h3 className="text-xl font-semibold">Глосарій ({glossary.length} слів)</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddAll}
            disabled={glossary.every(w => addedWords.has(w.pl))}
            className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            Додати всі
          </button>
          <button
            onClick={clearGlossary}
            className="rounded-full px-3 py-1 text-xs font-medium text-ink/40 transition hover:bg-ink/5 hover:text-ink/60"
          >
            Закрити
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {glossary.map((word, idx) => {
          const isAdded = addedWords.has(word.pl);
          const isAdding = addingWord === word.pl;

          // Difficulty badge colors
          const difficultyColors = {
            easy: "bg-moss/10 text-moss",
            medium: "bg-gold/10 text-gold",
            hard: "bg-terracotta/10 text-terracotta"
          };

          const difficultyLabels = {
            easy: "Легке",
            medium: "Середнє",
            hard: "Складне"
          };

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 transition ${
                isAdded
                  ? "border-gold/30 bg-gold/10"
                  : "border-ink/10 bg-paper/60 hover:border-gold/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{word.pl}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[word.difficulty]}`}>
                      {difficultyLabels[word.difficulty]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{word.uk}</p>
                  {word.context && (
                    <p className="mt-2 text-xs italic text-ink/50">
                      &quot;{word.context}&quot;
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleAddWord(word)}
                  disabled={isAdded || isAdding}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition ${
                    isAdded
                      ? "bg-gold text-paper"
                      : "border border-ink/20 text-ink/40 hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  {isAdding ? (
                    <Loader label="" size="sm" />
                  ) : isAdded ? (
                    <Check size={16} weight="bold" />
                  ) : (
                    <Plus size={16} weight="bold" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
