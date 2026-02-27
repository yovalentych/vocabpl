"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  Cards,
  Question,
  TrendUp,
  Shuffle,
  Lightning,
  CheckCircle,
  X,
  ArrowLeft,
  ArrowRight,
  SpeakerHigh,
  Eye,
  EyeSlash,
  Star
} from "@phosphor-icons/react";
import SpeakButton from "@/components/ui/SpeakButton";

interface AspectPair {
  id: string;
  imp: { pl: string; uk: string };
  perf: { pl: string; uk: string };
  pos: string;
  prefix?: string;
  examples?: {
    impUk: string;
    impPl: string;
    perfUk: string;
    perfPl: string;
  };
}

interface AspectPairsViewProps {
  pairs: AspectPair[];
  activeLetter: string;
  sortField: "pl" | "uk";
  hideTranslations: boolean;
  revealedMap: Record<string, boolean>;
  favoriteIds: Set<string>;
  onToggleFavorite: (wordId: string) => void;
  onRevealToggle: (wordId: string) => void;
}

type ViewMode = "grid" | "flashcards" | "quiz";
type QuizType = "choose_aspect" | "match_pair";

export default function AspectPairsView({
  pairs,
  activeLetter,
  sortField,
  hideTranslations,
  revealedMap,
  favoriteIds,
  onToggleFavorite,
  onRevealToggle
}: AspectPairsViewProps) {
  const { t, locale } = useLocale();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [prefixFilter, setPrefixFilter] = useState<string>("all");

  // Flashcard state
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownPairs, setKnownPairs] = useState<Set<string>>(new Set());

  // Quiz state
  const [quizType, setQuizType] = useState<QuizType>("choose_aspect");
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aspect_pairs_known");
      if (saved) {
        setKnownPairs(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  }, []);

  // Save progress to localStorage
  const toggleKnown = (pairId: string) => {
    setKnownPairs(prev => {
      const next = new Set(prev);
      if (next.has(pairId)) {
        next.delete(pairId);
      } else {
        next.add(pairId);
      }
      try {
        localStorage.setItem("aspect_pairs_known", JSON.stringify([...next]));
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
      return next;
    });
  };

  // Extract prefixes for filtering
  const prefixes = useMemo(() => {
    const set = new Set<string>();
    pairs.forEach(pair => {
      const imp = pair.imp.pl;
      const perf = pair.perf.pl;

      // Common prefixes
      const commonPrefixes = ['z', 'za', 'na', 'po', 'prze', 'przy', 'roz', 'wy', 'do', 'u', 'ob', 'od', 'w'];
      for (const prefix of commonPrefixes) {
        if (perf.startsWith(prefix) && imp.replace(/^(po|prze)/, '') === perf.replace(new RegExp(`^${prefix}`), '')) {
          set.add(prefix);
          break;
        }
      }
    });
    return ['all', ...Array.from(set).sort()];
  }, [pairs]);

  // Filter pairs
  const filteredPairs = useMemo(() => {
    let filtered = activeLetter === "all"
      ? pairs
      : pairs.filter(p => p.imp.pl.charAt(0).toUpperCase() === activeLetter);

    if (prefixFilter !== "all") {
      filtered = filtered.filter(p => p.perf.pl.startsWith(prefixFilter));
    }

    return filtered;
  }, [pairs, activeLetter, prefixFilter]);

  // Quiz questions
  const quizQuestions = useMemo(() => {
    return filteredPairs.slice(0, 20).map(pair => {
      const isImp = Math.random() > 0.5;
      const sentence = isImp
        ? (locale === "uk" ? "Codziennie ___" : "Codziennie ___")
        : (locale === "uk" ? "Wczoraj ___" : "Wczoraj ___");

      return {
        pairId: pair.id,
        sentence,
        correctAnswer: isImp ? 0 : 1,
        options: [pair.imp.pl, pair.perf.pl],
        explanation: isImp
          ? (locale === "uk" ? "Звичка → niedokonany" : "Nawyk → niedokonany")
          : (locale === "uk" ? "Одноразова дія → dokonany" : "Jednorazowa czynność → dokonany")
      };
    });
  }, [filteredPairs, locale]);

  // Navigation
  const nextCard = () => {
    setShowAnswer(false);
    setCurrentCard((prev) => (prev + 1) % filteredPairs.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCard((prev) => (prev - 1 + filteredPairs.length) % filteredPairs.length);
  };

  const handleQuizAnswer = (answerIdx: number) => {
    if (quizAnswer !== null) return;

    setQuizAnswer(answerIdx);
    setQuizTotal(prev => prev + 1);

    if (answerIdx === quizQuestions[currentQuiz].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuiz = () => {
    setQuizAnswer(null);
    if (currentQuiz < quizQuestions.length - 1) {
      setCurrentQuiz(prev => prev + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizTotal(0);
  };

  // Stats
  const stats = {
    total: filteredPairs.length,
    known: filteredPairs.filter(p => knownPairs.has(p.id)).length,
    progress: filteredPairs.length > 0
      ? Math.round((filteredPairs.filter(p => knownPairs.has(p.id)).length / filteredPairs.length) * 100)
      : 0
  };

  if (filteredPairs.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/60 p-10 text-center">
        <p className="text-ink/60">{locale === "uk" ? "Пари не знайдено" : "Nie znaleziono par"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode switcher + Stats */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-ink text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <Eye size={16} />
              {locale === "uk" ? "Сітка" : "Siatka"}
            </button>
            <button
              onClick={() => setViewMode("flashcards")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "flashcards"
                  ? "bg-gold text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <Cards size={16} />
              {locale === "uk" ? "Флешкартки" : "Fiszki"}
            </button>
            <button
              onClick={() => setViewMode("quiz")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "quiz"
                  ? "bg-terracotta text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <Question size={16} />
              {locale === "uk" ? "Квіз" : "Quiz"}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-bold text-moss">{stats.known}</span>
              <span className="text-ink/60"> / {stats.total}</span>
            </div>
            <div className="rounded-full bg-moss/10 px-3 py-1 text-sm font-semibold text-moss">
              {stats.progress}%
            </div>
          </div>
        </div>

        {/* Prefix filter */}
        {viewMode === "grid" && prefixes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-ink/50 self-center">
              {locale === "uk" ? "Префікси:" : "Prefiksy:"}
            </span>
            {prefixes.map(prefix => (
              <button
                key={prefix}
                onClick={() => setPrefixFilter(prefix)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  prefixFilter === prefix
                    ? "bg-moss text-paper"
                    : "border border-ink/10 text-ink/60 hover:border-moss/30 hover:bg-moss/5"
                }`}
              >
                {prefix === "all" ? (locale === "uk" ? "Всі" : "Wszystkie") : prefix + "-"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPairs.map(pair => {
            const pairId = pair.id;
            const isKnown = knownPairs.has(pairId);

            return (
              <div
                key={pairId}
                className={`group relative overflow-hidden rounded-[28px] border shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isKnown
                    ? "border-moss/40 bg-gradient-to-br from-moss/10 to-paper"
                    : "border-ink/10 bg-gradient-to-br from-paper to-moss/5"
                }`}
              >
                {/* Background effects */}
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-moss/10 blur-3xl transition-opacity group-hover:opacity-80" />
                <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-terracotta/10 blur-3xl transition-opacity group-hover:opacity-80" />

                <div className="relative space-y-4 p-6">
                  {/* Imperfective */}
                  <div className="space-y-2 rounded-2xl border border-moss/20 bg-moss/5 p-4 transition-colors group-hover:border-moss/30 group-hover:bg-moss/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🔄</span>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-moss font-bold">
                        Niedokonany
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-ink flex-1">
                          {sortField === "uk" ? pair.imp.uk : pair.imp.pl}
                        </p>
                        <SpeakButton text={pair.imp.pl} />
                      </div>
                      <p className="text-sm text-ink/70">
                        {hideTranslations && !revealedMap[`${pairId}-imp`]
                          ? "•••••"
                          : sortField === "uk" ? pair.imp.pl : pair.imp.uk}
                      </p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex items-center justify-center">
                    <div className="h-px w-full bg-gradient-to-r from-moss/30 via-ink/20 to-terracotta/30" />
                    <div className="flex-shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/50 border border-ink/10 mx-2">
                      ↓
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-terracotta/30 via-ink/20 to-moss/30" />
                  </div>

                  {/* Perfective */}
                  <div className="space-y-2 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 transition-colors group-hover:border-terracotta/30 group-hover:bg-terracotta/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">✅</span>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta font-bold">
                        Dokonany
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-ink flex-1">
                          {sortField === "uk" ? pair.perf.uk : pair.perf.pl}
                        </p>
                        <SpeakButton text={pair.perf.pl} />
                      </div>
                      <p className="text-sm text-ink/70">
                        {hideTranslations && !revealedMap[`${pairId}-perf`]
                          ? "•••••"
                          : sortField === "uk" ? pair.perf.pl : pair.perf.uk}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                    <button
                      onClick={() => toggleKnown(pairId)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                        isKnown
                          ? "text-moss"
                          : "text-ink/50 hover:text-moss"
                      }`}
                    >
                      {isKnown ? <CheckCircle size={16} weight="fill" /> : <CheckCircle size={16} />}
                      {isKnown ? (locale === "uk" ? "Знаю" : "Znam") : (locale === "uk" ? "Позначити" : "Oznacz")}
                    </button>
                    <button
                      onClick={() => onToggleFavorite(`${pairId}-imp`)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                        favoriteIds.has(`${pairId}-imp`)
                          ? "border-amber-400 bg-amber-200/60 text-amber-900"
                          : "border-ink/10 text-ink/50 hover:border-amber-300 hover:bg-amber-100/30"
                      }`}
                    >
                      {favoriteIds.has(`${pairId}-imp`) ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flashcard View */}
      {viewMode === "flashcards" && (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-gold/20 bg-gradient-to-br from-gold/5 to-paper p-8 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                <Cards size={24} weight="fill" className="text-gold" />
                {locale === "uk" ? "Режим флешкарток" : "Tryb fiszek"}
              </h3>
              <span className="text-sm text-ink/60">
                {currentCard + 1} / {filteredPairs.length}
              </span>
            </div>

            {/* Card */}
            <div
              className="relative min-h-[400px] rounded-[28px] border-2 border-gold/30 bg-paper p-10 cursor-pointer transition-all hover:border-gold/50"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                {!showAnswer ? (
                  <div className="text-center space-y-6">
                    <div className="text-sm uppercase tracking-[0.2em] text-gold mb-4 font-semibold">
                      {locale === "uk" ? "Яка пара?" : "Jaka para?"}
                    </div>
                    <div className="text-3xl font-bold text-ink mb-2">
                      {filteredPairs[currentCard]?.imp.pl}
                    </div>
                    <div className="text-lg text-ink/70">
                      {filteredPairs[currentCard]?.imp.uk}
                    </div>
                    <button className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors">
                      <Eye size={16} />
                      {locale === "uk" ? "Показати пару" : "Pokaż parę"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="text-sm uppercase tracking-[0.2em] text-terracotta mb-4 font-semibold">
                      {locale === "uk" ? "Доконаний вид" : "Aspekt dokonany"}
                    </div>
                    <div className="text-3xl font-bold text-terracotta mb-2">
                      {filteredPairs[currentCard]?.perf.pl}
                    </div>
                    <div className="text-lg text-ink/70">
                      {filteredPairs[currentCard]?.perf.uk}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleKnown(filteredPairs[currentCard].id);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                          knownPairs.has(filteredPairs[currentCard].id)
                            ? "border border-moss bg-moss/10 text-moss"
                            : "border border-ink/20 bg-paper text-ink hover:border-moss hover:bg-moss/5"
                        }`}
                      >
                        <CheckCircle size={16} weight={knownPairs.has(filteredPairs[currentCard].id) ? "fill" : "regular"} />
                        {knownPairs.has(filteredPairs[currentCard].id)
                          ? (locale === "uk" ? "Знаю ✓" : "Znam ✓")
                          : (locale === "uk" ? "Позначити як вивчене" : "Oznacz jako nauczone")
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink/40">
                {locale === "uk" ? "Клікни щоб перевернути" : "Kliknij aby przewrócić"}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prevCard}
                disabled={filteredPairs.length <= 1}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-semibold text-ink hover:border-gold/40 hover:bg-gold/5 transition-all disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                {locale === "uk" ? "Попередня" : "Poprzednia"}
              </button>

              <button
                onClick={() => {
                  const unknownPairs = filteredPairs.filter(p => !knownPairs.has(p.id));
                  if (unknownPairs.length > 0) {
                    const randomIdx = Math.floor(Math.random() * unknownPairs.length);
                    const randomPairIdx = filteredPairs.findIndex(p => p.id === unknownPairs[randomIdx].id);
                    setCurrentCard(randomPairIdx);
                    setShowAnswer(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 transition-all"
              >
                <Shuffle size={14} />
                {locale === "uk" ? "Випадкова" : "Losowa"}
              </button>

              <button
                onClick={nextCard}
                disabled={filteredPairs.length <= 1}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold hover:border-gold/50 hover:bg-gold/20 transition-all disabled:opacity-40"
              >
                {locale === "uk" ? "Наступна" : "Następna"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-ink/70">
            <strong className="text-moss">{locale === "uk" ? "💡 Порада:" : "💡 Wskazówka:"}</strong>{" "}
            {locale === "uk"
              ? "Намагайся згадати доконаний вид перед тим як перевернути картку. Повторюй щодня!"
              : "Spróbuj przypomnieć sobie aspekt dokonany przed przewróceniem fiszki. Powtarzaj codziennie!"}
          </div>
        </div>
      )}

      {/* Quiz View */}
      {viewMode === "quiz" && quizQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-terracotta/20 bg-gradient-to-br from-terracotta/5 to-paper p-8 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                <Question size={24} weight="fill" className="text-terracotta" />
                {locale === "uk" ? "Квіз: Вибери правильний вид" : "Quiz: Wybierz właściwy aspekt"}
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink/60">
                  {currentQuiz + 1} / {quizQuestions.length}
                </span>
                <span className="rounded-full bg-terracotta/10 px-3 py-1 text-sm font-semibold text-terracotta">
                  {quizScore} / {quizTotal}
                </span>
              </div>
            </div>

            {currentQuiz < quizQuestions.length && (
              <div>
                <p className="text-lg font-semibold text-ink mb-6">
                  {quizQuestions[currentQuiz].sentence}
                </p>

                <div className="space-y-3 mb-6">
                  {quizQuestions[currentQuiz].options.map((option, idx) => {
                    const isSelected = quizAnswer === idx;
                    const isCorrect = idx === quizQuestions[currentQuiz].correctAnswer;
                    const showResult = quizAnswer !== null;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={showResult}
                        className={`w-full text-left rounded-2xl border-2 p-4 transition-all font-medium ${
                          !showResult
                            ? isSelected
                              ? "border-terracotta bg-terracotta/10 text-terracotta"
                              : "border-ink/20 bg-paper hover:border-terracotta/40 hover:bg-terracotta/5 text-ink"
                            : isCorrect
                              ? "border-moss bg-moss/10 text-moss"
                              : isSelected
                                ? "border-terracotta bg-terracotta/10 text-terracotta opacity-60"
                                : "border-ink/10 bg-paper/60 text-ink/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showResult && isCorrect && (
                            <CheckCircle size={24} weight="fill" className="text-moss" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <X size={24} weight="bold" className="text-terracotta" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizAnswer !== null && (
                  <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-ink/70">
                      {quizQuestions[currentQuiz].explanation}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={resetQuiz}
                    className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 transition-all"
                  >
                    {locale === "uk" ? "Почати знову" : "Zacznij od nowa"}
                  </button>

                  {quizAnswer !== null && (
                    <button
                      onClick={nextQuiz}
                      className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-6 py-3 text-sm font-semibold text-terracotta hover:border-terracotta/50 hover:bg-terracotta/20 transition-all"
                    >
                      {currentQuiz < quizQuestions.length - 1
                        ? (locale === "uk" ? "Наступне" : "Następne")
                        : (locale === "uk" ? "Завершити" : "Zakończ")}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentQuiz >= quizQuestions.length && quizTotal > 0 && (
              <div className="text-center py-10">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-2xl font-bold text-ink mb-2">
                  {locale === "uk" ? "Квіз завершено!" : "Quiz ukończony!"}
                </h4>
                <p className="text-lg text-ink/70 mb-6">
                  {locale === "uk" ? "Твій результат:" : "Twój wynik:"}{" "}
                  <span className="font-bold text-terracotta">{quizScore} / {quizTotal}</span>
                  {" "}({Math.round((quizScore / quizTotal) * 100)}%)
                </p>
                <button
                  onClick={resetQuiz}
                  className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-6 py-3 text-sm font-semibold text-terracotta hover:border-terracotta/50 hover:bg-terracotta/20 transition-all"
                >
                  <Shuffle size={16} />
                  {locale === "uk" ? "Спробувати ще раз" : "Spróbuj ponownie"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
