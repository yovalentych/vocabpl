// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, FloppyDisk, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import ParaphraseResults from "./ParaphraseResults";

interface Sentence {
  id: string;
  original: string;
  paraphrase: string;
}

interface ParaphraseClassicPracticeProps {
  config: {
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  };
  onComplete: () => void;
}

const SENTENCE_BANKS = {
  A1: [
    "Dzień dobry, jak się masz?",
    "Mam na imię Anna.",
    "Mieszkam w Warszawie.",
    "To jest mój dom.",
    "Lubię czytać książki.",
    "Dziś jest piękna pogoda.",
    "Chcę iść do parku.",
    "Moja rodzina jest duża.",
    "Uwielbiam jeść pizzę.",
    "Co robisz w weekendy?"
  ],
  A2: [
    "Wczoraj poszedłem do kina i obejrzałem dobry film.",
    "Moja siostra studiuje medycynę na uniwersytecie.",
    "Zazwyczaj wstaję o siódmej rano i idę do pracy.",
    "Wolę podróżować pociągiem niż samolotem.",
    "W przyszłym tygodniu planuję odwiedzić moich rodziców.",
    "Ten sklep jest otwarty od poniedziałku do soboty.",
    "Nauka języków obcych wymaga dużo czasu i wysiłku.",
    "Mieszkam w centrum miasta, blisko wszystkich sklepów.",
    "Mój przyjaciel mieszka w innym kraju, ale często rozmawiamy online.",
    "Lubię gotować, szczególnie włoskie dania."
  ],
  B1: [
    "Mimo że było późno, zdecydowałem się dokończyć tę pracę jeszcze dziś.",
    "Dzięki regularnym treningom udało mi się znacznie poprawić kondycję.",
    "Chociaż pogoda była niepewna, wybraliśmy się na wycieczkę w góry.",
    "Pracuję zdalnie, co pozwala mi na elastyczne zarządzanie czasem.",
    "Uważam, że edukacja jest kluczem do sukcesu w życiu zawodowym.",
    "W ostatnich latach technologia znacznie zmieniła sposób naszej komunikacji.",
    "Planowanie budżetu pomaga mi lepiej kontrolować wydatki domowe.",
    "Zdrowe odżywianie i regularna aktywność fizyczna są podstawą dobrego samopoczucia.",
    "Poznanie nowej kultury podczas podróży zawsze mnie fascynuje.",
    "Staram się rozwijać swoje umiejętności przez kursy online i czytanie książek."
  ],
  B2: [
    "Zwiększająca się globalizacja prowadzi do większej integracji gospodarczej między krajami.",
    "Innowacyjne rozwiązania w dziedzinie odnawialnych źródeł energii mogą znacząco zmniejszyć emisję CO2.",
    "Analiza danych statystycznych wskazuje na wzrost zainteresowania zdrowiem psychicznym w społeczeństwie.",
    "Skuteczna komunikacja w zespole wymaga nie tylko umiejętności słuchania, ale również empatii.",
    "Transformacja cyfrowa przedsiębiorstw jest niezbędna dla utrzymania konkurencyjności na rynku.",
    "Zrównoważony rozwój zakłada równowagę między potrzebami ekonomicznymi, społecznymi i środowiskowymi.",
    "Inwestowanie w edukację pracowników przynosi długoterminowe korzyści dla organizacji.",
    "Pandemia przyspieszyła adaptację nowych technologii w różnych sektorach gospodarki.",
    "Krytyczne myślenie i umiejętność rozwiązywania problemów są cenione na współczesnym rynku pracy.",
    "Różnorodność kulturowa w miejscu pracy wzbogaca perspektywy i sprzyja innowacyjności."
  ]
};

export default function ParaphraseClassicPractice({ config, onComplete }: ParaphraseClassicPracticeProps) {
  const { t } = useLocale();
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load sentences based on config
  useEffect(() => {
    const bank = SENTENCE_BANKS[config.level];
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.count);

    const items: Sentence[] = selected.map((original, idx) => ({
      id: `sentence-${idx}`,
      original,
      paraphrase: ""
    }));

    setSentences(items);
    setActiveId(items[0]?.id || null);
    setIsLoading(false);
  }, [config]);

  const activeSentence = sentences.find((s) => s.id === activeId);
  const activeIndex = sentences.findIndex((s) => s.id === activeId);

  const updateParaphrase = (sentenceId: string, value: string) => {
    setSentences((prev) =>
      prev.map((sentence) =>
        sentence.id === sentenceId
          ? { ...sentence, paraphrase: value }
          : sentence
      )
    );
  };

  const completedCount = sentences.filter((s) => s.paraphrase.trim()).length;
  const totalPoints = completedCount;

  const handleCheckWithAI = async () => {
    const completed = sentences.filter((s) => s.paraphrase.trim());

    if (completed.length === 0) {
      alert("Будь ласка, перефразуйте хоча б одне речення");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const items = completed.map((sentence) => ({
        original: sentence.original,
        paraphrase: sentence.paraphrase.trim()
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paraphrase_check",
          userInput: JSON.stringify({
            exerciseType: "paraphrase",
            action: "check",
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

      const result = JSON.parse(String(data?.text || "{}"));

      // Save points to database
      if (result?.overall?.pointsForRating) {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "paraphrase",
            points: result.overall.pointsForRating,
            xp: result.overall.xp || 0
          })
        });
      }

      // Show results
      setResults({
        mode: "classic",
        totalSentences: sentences.length,
        completedSentences: completed.length,
        aiCheck: result,
        topic: "Різні теми",
        level: config.level
      });
      setShowResults(true);
    } catch (error) {
      console.error("Failed to check with AI:", error);
      setError("Помилка перевірки");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const completed = sentences.filter((s) => s.paraphrase.trim());

    if (completed.length === 0) {
      alert("Будь ласка, перефразуйте хоча б одне речення");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "paraphrase",
          level: config.level,
          items: completed.map((s) => ({
            original: s.original,
            paraphrase: s.paraphrase
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Помилка надсилання");
        return;
      }

      // Save minimal points for submission
      await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: "paraphrase",
          points: completed.length,
          xp: completed.length * 2
        })
      });

      alert("✅ Вправу надіслано на перевірку! Очікуйте фідбек від викладача.");
      onComplete();
    } catch (error) {
      console.error("Failed to submit:", error);
      setError("Помилка надсилання");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta/20 border-t-terracotta mx-auto" />
        <p className="mt-4 text-sm text-ink/60">Завантаження речень...</p>
      </div>
    );
  }

  if (!activeSentence) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          Речення не знайдено. Спробуйте інші налаштування.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left sidebar - sentence list */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
              Речення
            </p>
            <div className="text-xs text-ink/50">
              {activeIndex + 1} / {sentences.length}
            </div>
          </div>

          <div className="space-y-2">
            {sentences.map((sentence, idx) => {
              const isActive = sentence.id === activeId;
              const isCompleted = sentence.paraphrase.trim().length > 0;

              return (
                <button
                  key={sentence.id}
                  onClick={() => setActiveId(sentence.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-terracotta bg-terracotta/5"
                      : "border-ink/10 hover:border-ink/30 hover:bg-paper"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink/50 mb-1">Речення {idx + 1}</p>
                      <p className="text-sm text-ink/80 truncate">
                        {sentence.original}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle size={18} weight="fill" className="text-moss" />
                      ) : (
                        <Circle size={18} className="text-ink/20" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
                Прогрес
              </span>
              <span className="text-sm font-bold text-terracotta">
                {completedCount} / {sentences.length}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all"
                style={{ width: `${(completedCount / sentences.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right panel - paraphrase input */}
        <div className="space-y-6">
          {/* Level badge */}
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-2 inline-flex items-center gap-2">
            <span className="text-xs font-semibold text-terracotta">
              Рівень: {config.level}
            </span>
          </div>

          {/* Original sentence */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Оригінальне речення
            </p>
            <p className="text-lg text-ink leading-relaxed">
              {activeSentence.original}
            </p>
          </div>

          {/* Paraphrase input */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Ваше перефразування
            </p>

            <textarea
              value={activeSentence.paraphrase}
              onChange={(e) => updateParaphrase(activeSentence.id, e.target.value)}
              placeholder="Напишіть це речення іншими словами..."
              rows={5}
              className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-terracotta/40 focus:outline-none focus:ring-0"
            />

            <p className="mt-2 text-xs text-ink/50">
              Спробуйте змінити структуру та використати синоніми
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCheckWithAI}
                disabled={isCheckingAI || completedCount === 0}
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
                disabled={isSubmitting || completedCount === 0}
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

              <button
                onClick={() => {
                  const currentIndex = sentences.findIndex((s) => s.id === activeId);
                  const nextSentence = sentences[currentIndex + 1];
                  if (nextSentence) {
                    setActiveId(nextSentence.id);
                  }
                }}
                disabled={activeIndex === sentences.length - 1}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Наступне речення</span>
                <span>→</span>
              </button>
            </div>

            <p className="text-xs text-ink/50">
              💡 Перевірка з AI дає детальний фідбек та оцінку. Відправка на перевірку — для ручного review від викладача.
            </p>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <ParaphraseResults
          results={results}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
