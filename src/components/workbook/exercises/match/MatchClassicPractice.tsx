// @ts-nocheck
"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import MatchResults from "./MatchResults";

interface MatchClassicPracticeProps {
  config: {
    pairType: "translation" | "semantic" | "definition";
    level: "A1" | "A2" | "B1" | "B2";
    pairCount: number;
  };
  onComplete: () => void;
}

interface Pair {
  id: string;
  leftId: string;
  rightId: string;
  left: string;
  right: string;
}

// Static placeholder data - in real app this would come from database
const generateStaticPairs = (type: string, level: string, count: number): Pair[] => {
  const translationPairs = [
    { id: "1", left: "dom", right: "будинок" },
    { id: "2", left: "kobieta", right: "жінка" },
    { id: "3", left: "dziecko", right: "дитина" },
    { id: "4", left: "jedzenie", right: "їжа" },
    { id: "5", left: "woda", right: "вода" },
    { id: "6", left: "książka", right: "книжка" },
    { id: "7", left: "szkoła", right: "школа" },
    { id: "8", left: "praca", right: "робота" },
    { id: "9", left: "rodzina", right: "родина" },
    { id: "10", left: "przyjaźń", right: "дружба" },
    { id: "11", left: "miłość", right: "кохання" },
    { id: "12", left: "wolność", right: "свобода" },
    { id: "13", left: "wiedza", right: "знання" },
    { id: "14", left: "siła", right: "сила" },
    { id: "15", left: "spokój", right: "спокій" },
    { id: "16", left: "radość", right: "радість" },
    { id: "17", left: "smutek", right: "смуток" },
    { id: "18", left: "szczęście", right: "щастя" },
    { id: "19", left: "nadzieja", right: "надія" },
    { id: "20", left: "marzenie", right: "мрія" }
  ];

  const semanticPairs = [
    { id: "1", left: "gorący", right: "zimny" },
    { id: "2", left: "duży", right: "mały" },
    { id: "3", left: "dobry", right: "zły" },
    { id: "4", left: "szybki", right: "wolny" },
    { id: "5", left: "wysoki", right: "niski" },
    { id: "6", left: "szeroki", right: "wąski" },
    { id: "7", left: "ciężki", right: "lekki" },
    { id: "8", left: "stary", right: "młody" },
    { id: "9", left: "nowy", right: "stary" },
    { id: "10", left: "jasny", right: "ciemny" },
    { id: "11", left: "głośny", right: "cichy" },
    { id: "12", left: "bogaty", right: "biedny" },
    { id: "13", left: "silny", right: "słaby" },
    { id: "14", left: "mądry", right: "głupi" },
    { id: "15", left: "piękny", right: "brzydki" },
    { id: "16", left: "czysty", right: "brudny" },
    { id: "17", left: "twardy", right: "miękki" },
    { id: "18", left: "długi", right: "krótki" },
    { id: "19", left: "pełny", right: "pusty" },
    { id: "20", left: "mokry", right: "suchy" }
  ];

  const definitionPairs = [
    { id: "1", left: "dom", right: "miejsce, gdzie się mieszka" },
    { id: "2", left: "książka", right: "zbiór kartek z tekstem" },
    { id: "3", left: "szkoła", right: "miejsce, gdzie się uczy" },
    { id: "4", left: "telefon", right: "urządzenie do rozmów" },
    { id: "5", left: "komputer", right: "maszyna do pracy i zabawy" },
    { id: "6", left: "samochód", right: "pojazd z silnikiem" },
    { id: "7", left: "kwiat", right: "roślina z kolorowymi płatkami" },
    { id: "8", left: "stół", right: "mebel do jedzenia" },
    { id: "9", left: "krzesło", right: "mebel do siedzenia" },
    { id: "10", left: "okno", right: "otwór w ścianie ze szkłem" },
    { id: "11", left: "drzwi", right: "wejście do pomieszczenia" },
    { id: "12", left: "lampa", right: "źródło światła" },
    { id: "13", left: "zegar", right: "urządzenie pokazujące czas" },
    { id: "14", left: "lustro", right: "odbija obraz" },
    { id: "15", left: "klucz", right: "otwiera zamek" },
    { id: "16", left: "telefon", right: "służy do dzwonienia" },
    { id: "17", left: "torba", right: "nosi się rzeczy" },
    { id: "18", left: "parasol", right: "chroni przed deszczem" },
    { id: "19", left: "okulary", right: "pomagają widzieć" },
    { id: "20", left: "zegarek", right: "nosi się na ręce" }
  ];

  let basePairs = translationPairs;
  if (type === "semantic") basePairs = semanticPairs;
  if (type === "definition") basePairs = definitionPairs;

  // Add unique leftId and rightId to each pair
  return basePairs.slice(0, Math.min(count, basePairs.length)).map(pair => ({
    ...pair,
    leftId: `L${pair.id}`,
    rightId: `R${pair.id}`
  }));
};

export default function MatchClassicPractice({ config, onComplete }: MatchClassicPracticeProps) {
  const { t } = useLocale();
  const [pairs] = useState(() => generateStaticPairs(config.pairType, config.level, config.pairCount));
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<any>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProcessing = isCheckingAI || isSubmitting;

  // Shuffle right items for display
  const [rightItems] = useState(() => {
    const items = [...pairs];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const handleLeftClick = (leftId: string) => {
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft) return;

    // Create or update match
    setMatches((prev) => ({
      ...prev,
      [selectedLeft]: rightId
    }));

    setSelectedLeft(null);
  };

  const getMatchStatus = (leftId: string, correctRightId: string): "correct" | "incorrect" | "none" => {
    const matchedRightId = matches[leftId];
    if (!matchedRightId) return "none";
    return matchedRightId === correctRightId ? "correct" : "incorrect";
  };

  const isRightMatched = (rightId: string) => {
    return Object.values(matches).includes(rightId);
  };

  const handleCheckWithAI = async () => {
    if (Object.keys(matches).length === 0) {
      setError("Будь ласка, створіть хоча б одну пару");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const items = Object.entries(matches).map(([leftId, rightId]) => {
        const leftPair = pairs.find(p => p.id === leftId);
        const rightPair = pairs.find(p => p.id === rightId);
        return {
          left: leftPair?.left || "",
          right: rightPair?.right || "",
          isCorrect: leftId === rightId
        };
      });

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "match_check",
          userInput: JSON.stringify({
            exerciseType: "match",
            action: "check",
            pairType: config.pairType,
            level: config.level,
            items
          }),
          context: JSON.stringify({ uiLanguage: t.locale || "uk" })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        return;
      }

      const result = safeParseAIResponse(data?.text);

      if (!result || !result.pairs) {
        setError("AI повернула неправильний формат відповіді. Спробуйте ще раз.");
        return;
      }

      // Save points to database
      if (result?.overall?.score01 != null) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "match",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: pairs.length, exercise: "match" })
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

      // Store AI result and show results
      setAiCheckResult(result);
      setShowResults(true);
    } catch (err) {
      console.error("Failed to check with AI:", err);
      setError("Помилка перевірки");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (Object.keys(matches).length === 0) {
      setError("Будь ласка, створіть хоча б одну пару");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const items = Object.entries(matches).map(([leftId, rightId]) => {
        const leftPair = pairs.find(p => p.id === leftId);
        const rightPair = pairs.find(p => p.id === rightId);
        return {
          left: leftPair?.left || "",
          right: rightPair?.right || "",
          isCorrect: leftId === rightId
        };
      });

      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "match",
          pairType: config.pairType,
          level: config.level,
          items
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        setError(data?.error || "Помилка надсилання");
        return;
      }

      // Save minimal points for submission
      try {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "match",
            points: calculatePoints({ score01: 0.5, level: config.level, itemCount: pairs.length, exercise: "match" })
          })
        });
      } catch (err) {
        console.error("Failed to save points:", err);
      }

      setSuccessMessage("Вправу надіслано на перевірку! Очікуйте фідбек від викладача.");
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error("Failed to submit:", err);
      setError("Помилка надсилання");
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedCount = Object.keys(matches).length;
  const correctCount = pairs.filter((pair) => matches[pair.id] === pair.id).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta/70 mb-2">
                Класичний режим
              </p>
              <h2 className="text-xl font-semibold text-ink">
                Знайдіть пари
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {config.pairType === "translation" && "Переклад"}
                {config.pairType === "semantic" && "Семантичні пари"}
                {config.pairType === "definition" && "Визначення"} · {config.level} · {pairs.length} пар
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-terracotta">{matchedCount}/{pairs.length}</div>
              <div className="text-xs text-ink/50">з&apos;єднано</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs text-ink/70">
            <span className="font-semibold text-gold">Інструкція:</span> Натисніть на елемент зліва,
            потім натисніть відповідний елемент справа, щоб створити пару.
          </p>
        </div>

        {/* Matching area */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Left column */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Ліва колонка
            </p>
            <div className="space-y-2">
              {pairs.map((pair) => {
                const isSelected = selectedLeft === pair.leftId;
                const status = getMatchStatus(pair.leftId, pair.rightId);
                const isMatched = matches[pair.leftId];

                return (
                  <button
                    key={pair.leftId}
                    onClick={() => handleLeftClick(pair.leftId)}
                    disabled={isMatched && status === "correct"}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-terracotta bg-terracotta/10"
                        : status === "correct"
                        ? "border-moss bg-moss/5 cursor-default"
                        : status === "incorrect"
                        ? "border-gold bg-gold/5"
                        : "border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {status === "correct" ? (
                          <CheckCircle size={20} weight="fill" className="text-moss" />
                        ) : status === "incorrect" ? (
                          <Circle size={20} weight="fill" className="text-gold" />
                        ) : isSelected ? (
                          <Circle size={20} weight="fill" className="text-terracotta" />
                        ) : (
                          <Circle size={20} className="text-ink/30" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink">{pair.left}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Права колонка
            </p>
            <div className="space-y-2">
              {rightItems.map((pair) => {
                const isMatched = isRightMatched(pair.rightId);
                const matchingLeftId = Object.keys(matches).find(
                  (leftId) => matches[leftId] === pair.rightId
                );
                const isCorrect = matchingLeftId === pair.leftId;

                return (
                  <button
                    key={pair.rightId}
                    onClick={() => handleRightClick(pair.rightId)}
                    disabled={isMatched && isCorrect}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isMatched && isCorrect
                        ? "border-moss bg-moss/5 cursor-default"
                        : isMatched
                        ? "border-gold bg-gold/5"
                        : selectedLeft
                        ? "border-ink/20 hover:bg-terracotta/5 hover:border-terracotta/40"
                        : "border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isMatched && isCorrect ? (
                          <CheckCircle size={20} weight="fill" className="text-moss" />
                        ) : isMatched ? (
                          <Circle size={20} weight="fill" className="text-gold" />
                        ) : (
                          <Circle size={20} className="text-ink/30" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink">{pair.right}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-moss">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCheckWithAI}
              disabled={isProcessing || matchedCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCheckingAI ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>AI перевіряє...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>Перевірити з AI</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmitForReview}
              disabled={isProcessing || matchedCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>Надсилання...</span>
                </>
              ) : (
                <>
                  <PaperPlaneRight size={18} weight="fill" />
                  <span>Надіслати на перевірку</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-ink/50">
            Перевірка з AI дає детальний фідбек та оцінку. Відправка на перевірку — для ручного review від викладача.
          </p>

          <div className="text-center text-sm text-ink/60">
            З&apos;єднано: {matchedCount} з {pairs.length}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <MatchResults
          results={{
            mode: "classic",
            totalPairs: pairs.length,
            correctMatches: correctCount,
            score: correctCount / pairs.length,
            aiCheck: aiCheckResult,
            pairType: config.pairType,
            level: config.level
          }}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
