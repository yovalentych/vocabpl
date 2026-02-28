"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Eye, EyeSlash, Cards, Question, Lightbulb, Warning, BookOpen, Sparkle, X } from "@phosphor-icons/react";
import { renderSimpleMarkdown } from "@/components/markdown";
import type { CompendiumSprint, CompendiumRule } from "@/lib/compendium-content";

interface TopicContentInteractiveProps {
  topic: CompendiumSprint | CompendiumRule;
  topicType: "sprint" | "rule";
  locale: string;
  relatedTopics: Array<CompendiumSprint | CompendiumRule>;
}

type ViewMode = "theory" | "flashcards" | "quiz";

export default function TopicContentInteractive({
  topic,
  topicType,
  locale,
  relatedTopics
}: TopicContentInteractiveProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("theory");
  const [isCompleted, setIsCompleted] = useState(false);
  const [revealedExamples, setRevealedExamples] = useState<Set<number>>(new Set());
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  const pick = (uk: string | undefined, pl: string | undefined) => {
    if (!uk && !pl) return "";
    return (locale === "pl" && pl) ? pl : (uk || pl || "");
  };

  // Load completion status
  useEffect(() => {
    try {
      const savedCompletedSprints = localStorage.getItem("grammar_completed_sprints");
      const savedCompletedRules = localStorage.getItem("grammar_completed_rules");

      if (topicType === "sprint" && savedCompletedSprints) {
        const completed = new Set(JSON.parse(savedCompletedSprints));
        setIsCompleted(completed.has(topic.id));
      } else if (topicType === "rule" && savedCompletedRules) {
        const completed = new Set(JSON.parse(savedCompletedRules));
        setIsCompleted(completed.has(topic.id));
      }
    } catch (error) {
      console.error("Failed to load completion status:", error);
    }
  }, [topic.id, topicType]);

  const toggleCompletion = () => {
    try {
      const storageKey = topicType === "sprint" ? "grammar_completed_sprints" : "grammar_completed_rules";
      const saved = localStorage.getItem(storageKey);
      const completed = saved ? new Set(JSON.parse(saved)) : new Set<string>();

      if (completed.has(topic.id)) {
        completed.delete(topic.id);
      } else {
        completed.add(topic.id);
      }

      localStorage.setItem(storageKey, JSON.stringify([...completed]));
      setIsCompleted(!isCompleted);
    } catch (error) {
      console.error("Failed to toggle completion:", error);
    }
  };

  const toggleExampleReveal = (index: number) => {
    const newRevealed = new Set(revealedExamples);
    if (newRevealed.has(index)) {
      newRevealed.delete(index);
    } else {
      newRevealed.add(index);
    }
    setRevealedExamples(newRevealed);
  };

  // Get examples for flashcards
  const examples = (locale === "uk" ?
    ("examplesUk" in topic ? topic.examplesUk : []) :
    ("examplesPl" in topic ? topic.examplesPl : [])) || [];

  // Get explanations for flashcards
  const explanations = (locale === "uk" ?
    ("exampleExplanationsUk" in topic ? topic.exampleExplanationsUk : []) :
    ("exampleExplanationsPl" in topic ? topic.exampleExplanationsPl : [])) || [];

  // Get quiz questions
  const quizQuestions = ("quizQuestions" in topic ? topic.quizQuestions : []) || [];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const nextFlashcard = () => {
    setShowFlashcardAnswer(false);
    setCurrentFlashcard((prev) => (prev + 1) % (examples as any[]).length);
  };

  const prevFlashcard = () => {
    setShowFlashcardAnswer(false);
    setCurrentFlashcard((prev) => (prev - 1 + (examples as any[]).length) % (examples as any[]).length);
  };

  const handleAnswerSelect = (index: number) => {
    if (showQuizResult) return; // Already answered
    setSelectedAnswer(index);
    setShowQuizResult(true);

    if (index === quizQuestions[currentQuestion]?.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion));
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setCurrentQuestion((prev) => (prev + 1) % (quizQuestions as any[]).length);
  };

  const prevQuestion = () => {
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setCurrentQuestion((prev) => (prev - 1 + (quizQuestions as any[]).length) % (quizQuestions as any[]).length);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setQuizScore(0);
    setAnsweredQuestions(new Set());
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle + Completion */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-ink/10 bg-paper/60">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("theory")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              viewMode === "theory"
                ? "bg-moss text-paper border border-moss"
                : "border border-ink/20 text-ink hover:border-moss/40 hover:bg-moss/5"
            }`}
          >
            <BookOpen size={16} weight={viewMode === "theory" ? "fill" : "regular"} />
            {locale === "uk" ? "Теорія" : "Teoria"}
          </button>

          {(examples as any[]).length > 0 && (
            <button
              onClick={() => setViewMode("flashcards")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "flashcards"
                  ? "bg-gold text-paper border border-gold"
                  : "border border-ink/20 text-ink hover:border-gold/40 hover:bg-gold/5"
              }`}
            >
              <Cards size={16} weight={viewMode === "flashcards" ? "fill" : "regular"} />
              {locale === "uk" ? "Флешкартки" : "Fiszki"}
            </button>
          )}

          {(quizQuestions as any[]).length > 0 && (
            <button
              onClick={() => setViewMode("quiz")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "quiz"
                  ? "bg-terracotta text-paper border border-terracotta"
                  : "border border-ink/20 text-ink hover:border-terracotta/40 hover:bg-terracotta/5"
              }`}
            >
              <Question size={16} weight={viewMode === "quiz" ? "fill" : "regular"} />
              {locale === "uk" ? "Квіз" : "Quiz"}
            </button>
          )}
        </div>

        <button
          onClick={toggleCompletion}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold hover:border-moss/40 hover:bg-moss/5 transition-all"
        >
          {isCompleted ? (
            <>
              <CheckCircle size={20} weight="fill" className="text-moss" />
              <span className="text-moss">{locale === "uk" ? "Вивчено" : "Ukończone"}</span>
            </>
          ) : (
            <>
              <Circle size={20} className="text-ink/40" />
              <span className="text-ink">{locale === "uk" ? "Позначити вивченим" : "Oznacz jako ukończone"}</span>
            </>
          )}
        </button>
      </div>

      {/* Theory View */}
      {viewMode === "theory" && (
        <div className="space-y-6">
          {/* Detailed Explanation */}
          {(topic.detailedUk || topic.detailedPl) && (
            <section className="rounded-[28px] border border-moss/20 bg-gradient-to-br from-moss/5 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={22} weight="fill" className="text-moss" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Детальне пояснення" : "Szczegółowe wyjaśnienie"}
                </h2>
              </div>
              <div className="text-base text-ink/80 leading-relaxed">
                {pick(topic.detailedUk, topic.detailedPl)}
              </div>
            </section>
          )}

          {/* Examples Section */}
          {(examples as any[]).length > 0 && (
            <section className="rounded-[28px] border border-gold/20 bg-gradient-to-br from-gold/5 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={22} weight="fill" className="text-gold" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Приклади" : "Przykłady"}
                </h2>
              </div>
              <div className="space-y-3">
                {(examples as any[]).map((example, idx) => {
                  const isRevealed = revealedExamples.has(idx);
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-ink/10 bg-paper p-4 hover:border-gold/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 text-sm text-ink/70 leading-relaxed prose prose-sm">
                          {renderSimpleMarkdown(example)}
                        </div>
                        <button
                          onClick={() => toggleExampleReveal(idx)}
                          className="flex-shrink-0 rounded-lg border border-ink/20 bg-paper p-2 hover:border-gold/40 hover:bg-gold/5 transition-all"
                          title={isRevealed ? (locale === "uk" ? "Приховати" : "Ukryj") : (locale === "uk" ? "Показати деталі" : "Pokaż szczegóły")}
                        >
                          {isRevealed ? (
                            <EyeSlash size={16} className="text-ink/60" />
                          ) : (
                            <Eye size={16} className="text-gold" />
                          )}
                        </button>
                      </div>
                      {isRevealed && explanations[idx] && (
                        <div className="mt-3 pt-3 border-t border-ink/10 text-sm text-ink/70 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                          {explanations[idx]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Counter Examples (for rules) */}
          {"counterExamplesUk" in topic && topic.counterExamplesUk && (topic.counterExamplesUk as any[]).length > 0 && (
            <section className="rounded-[28px] border border-terracotta/20 bg-gradient-to-br from-terracotta/5 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Warning size={22} weight="fill" className="text-terracotta" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Неправильно / Типові помилки" : "Błędnie / Częste błędy"}
                </h2>
              </div>
              <ul className="space-y-2">
                {((locale === "uk" ? topic.counterExamplesUk : ("counterExamplesPl" in topic ? topic.counterExamplesPl : undefined)) as any[])?.map((example, idx) => (
                  <li key={idx} className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                    {renderSimpleMarkdown(example)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Common Mistakes (for sprints) */}
          {("commonMistakesUk" in topic && (topic.commonMistakesUk || topic.commonMistakesPl)) && (
            <section className="rounded-[28px] border border-terracotta/20 bg-gradient-to-br from-terracotta/5 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Warning size={22} weight="fill" className="text-terracotta" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Типові помилки" : "Częste błędy"}
                </h2>
              </div>
              <div className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                {renderSimpleMarkdown(pick(topic.commonMistakesUk, topic.commonMistakesPl))}
              </div>
            </section>
          )}

          {/* Tips */}
          {("tipsUk" in topic && (topic.tipsUk || topic.tipsPl)) && (
            <section className="rounded-[28px] border border-moss/20 bg-gradient-to-br from-moss/5 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Sparkle size={22} weight="fill" className="text-moss" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Поради для вивчення" : "Wskazówki do nauki"}
                </h2>
              </div>
              <div className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                {renderSimpleMarkdown(pick(topic.tipsUk, topic.tipsPl))}
              </div>
            </section>
          )}

          {/* Mnemonic (for rules) */}
          {("mnemonicUk" in topic && (topic.mnemonicUk || topic.mnemonicPl)) && (
            <section className="rounded-[28px] border border-gold/20 bg-gradient-to-br from-gold/10 to-paper p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={22} weight="fill" className="text-gold" />
                <h2 className="text-xl font-bold text-ink">
                  {locale === "uk" ? "Мнемоніка (як запам'ятати)" : "Mnemonika (jak zapamiętać)"}
                </h2>
              </div>
              <div className="text-base text-ink/70 leading-relaxed prose prose-base font-medium">
                {renderSimpleMarkdown(pick(topic.mnemonicUk, topic.mnemonicPl))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Flashcards View */}
      {viewMode === "flashcards" && (examples as any[]).length > 0 && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-gold/20 bg-gradient-to-br from-gold/5 to-paper p-8 sm:p-10 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Cards size={24} weight="fill" className="text-gold" />
                {locale === "uk" ? "Режим флешкарток" : "Tryb fiszek"}
              </h2>
              <span className="text-sm text-ink/60">
                {currentFlashcard + 1} / {(examples as any[]).length}
              </span>
            </div>

            {/* Flashcard */}
            <div
              className="relative min-h-[280px] rounded-3xl border-2 border-gold/30 bg-paper p-8 cursor-pointer hover:border-gold/50 transition-all"
              onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  {!showFlashcardAnswer ? (
                    <>
                      <div className="text-sm uppercase tracking-[0.2em] text-gold mb-4 font-semibold">
                        {locale === "uk" ? "Приклад" : "Przykład"}
                      </div>
                      <div className="text-lg sm:text-xl text-ink leading-relaxed prose prose-lg mx-auto">
                        {renderSimpleMarkdown(examples[currentFlashcard])}
                      </div>
                      <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors">
                        <Eye size={16} />
                        {locale === "uk" ? "Показати пояснення" : "Pokaż wyjaśnienie"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm uppercase tracking-[0.2em] text-moss mb-4 font-semibold">
                        {locale === "uk" ? "Пояснення" : "Wyjaśnienie"}
                      </div>
                      <div className="text-base sm:text-lg text-ink/80 leading-relaxed max-w-2xl mx-auto">
                        {explanations[currentFlashcard] || (locale === "uk" ? "📚 Детальний розбір цього прикладу" : "📚 Szczegółowa analiza tego przykładu")}
                      </div>
                      <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-2 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors">
                        <EyeSlash size={16} />
                        {locale === "uk" ? "Приховати" : "Ukryj"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Click hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink/40">
                {locale === "uk" ? "Клікни щоб перевернути" : "Kliknij aby przewrócić"}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prevFlashcard}
                className="rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-semibold text-ink hover:border-gold/40 hover:bg-gold/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={(examples as any[]).length <= 1}
              >
                ← {locale === "uk" ? "Попередня" : "Poprzednia"}
              </button>

              <button
                onClick={() => setRevealedExamples(new Set())}
                className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 transition-all"
              >
                {locale === "uk" ? "Скинути прогрес" : "Resetuj postęp"}
              </button>

              <button
                onClick={nextFlashcard}
                className="rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold hover:border-gold/50 hover:bg-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={(examples as any[]).length <= 1}
              >
                {locale === "uk" ? "Наступна" : "Następna"} →
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-ink/70">
            <strong className="text-moss">{locale === "uk" ? "💡 Порада:" : "💡 Wskazówka:"}</strong>{" "}
            {locale === "uk"
              ? "Переглядай кожну флешкартку кілька разів, поки не запам'ятаєш приклад. Повертайся до них щодня!"
              : "Przeglądaj każdą fiszkę kilka razy, aż zapamiętasz przykład. Wracaj do nich codziennie!"}
          </div>
        </div>
      )}

      {/* Quiz View */}
      {viewMode === "quiz" && (quizQuestions as any[]).length > 0 && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-terracotta/20 bg-gradient-to-br from-terracotta/5 to-paper p-8 sm:p-10 shadow-soft">
            {/* Quiz Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Question size={24} weight="fill" className="text-terracotta" />
                {locale === "uk" ? "Перевір знання" : "Sprawdź wiedzę"}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink/60">
                  {currentQuestion + 1} / {(quizQuestions as any[]).length}
                </span>
                <span className="rounded-full bg-terracotta/10 px-3 py-1 text-sm font-semibold text-terracotta">
                  {quizScore} / {answeredQuestions.size}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <p className="text-lg font-semibold text-ink mb-4">
                {locale === "uk" ? quizQuestions[currentQuestion].questionUk : quizQuestions[currentQuestion].questionPl}
              </p>

              {/* Answer Options */}
              <div className="space-y-3">
                {quizQuestions[currentQuestion].options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === quizQuestions[currentQuestion].correctIndex;
                  const showResult = showQuizResult;

                  let buttonClass = "w-full text-left rounded-2xl border-2 p-4 transition-all font-medium ";
                  if (!showResult) {
                    buttonClass += isSelected
                      ? "border-terracotta bg-terracotta/10 text-terracotta"
                      : "border-ink/20 bg-paper hover:border-terracotta/40 hover:bg-terracotta/5 text-ink";
                  } else {
                    if (isCorrect) {
                      buttonClass += "border-moss bg-moss/10 text-moss";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-terracotta bg-terracotta/10 text-terracotta opacity-60";
                    } else {
                      buttonClass += "border-ink/10 bg-paper/60 text-ink/50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current text-sm font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
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
            </div>

            {/* Explanation */}
            {showQuizResult && (
              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-ink/70 leading-relaxed">
                  {locale === "uk" ? quizQuestions[currentQuestion].explanationUk : quizQuestions[currentQuestion].explanationPl}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={prevQuestion}
                className="rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-semibold text-ink hover:border-terracotta/40 hover:bg-terracotta/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={(quizQuestions as any[]).length <= 1}
              >
                ← {locale === "uk" ? "Попереднє" : "Poprzednie"}
              </button>

              <button
                onClick={resetQuiz}
                className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 transition-all"
              >
                {locale === "uk" ? "Почати знову" : "Zacznij od nowa"}
              </button>

              <button
                onClick={nextQuestion}
                className="rounded-full border border-terracotta/30 bg-terracotta/10 px-6 py-3 text-sm font-semibold text-terracotta hover:border-terracotta/50 hover:bg-terracotta/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={(quizQuestions as any[]).length <= 1}
              >
                {locale === "uk" ? "Наступне" : "Następne"} →
              </button>
            </div>
          </div>

          {/* Quiz Tips */}
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-ink/70">
            <strong className="text-moss">{locale === "uk" ? "💡 Порада:" : "💡 Wskazówka:"}</strong>{" "}
            {locale === "uk"
              ? "Відповідай на всі питання, щоб перевірити своє розуміння теми. Можеш повторювати квіз скільки завгодно!"
              : "Odpowiedz na wszystkie pytania, aby sprawdzić swoje zrozumienie tematu. Możesz powtarzać quiz ile chcesz!"}
          </div>
        </div>
      )}
    </div>
  );
}
