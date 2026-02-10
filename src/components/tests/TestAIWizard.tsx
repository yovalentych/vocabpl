"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkle } from "@phosphor-icons/react";
import TestAIGenerator from "./TestAIGenerator";
import TestAISession from "./TestAISession";
import type { GeneratedTest, TestQuestion } from "./TestAIGenerator";

type Step = "config" | "test";

interface TestAIWizardProps {
  locale?: string;
}

export default function TestAIWizard({ locale = "uk" }: TestAIWizardProps) {
  const [step, setStep] = useState<Step>("config");
  const [currentTest, setCurrentTest] = useState<GeneratedTest | null>(null);
  const [allQuestions, setAllQuestions] = useState<TestQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 6;

  // Get questions for current page
  const getCurrentPageQuestions = (): TestQuestion[] => {
    const start = currentPage * questionsPerPage;
    const end = start + questionsPerPage;
    return allQuestions.slice(start, end);
  };

  const totalPages = Math.ceil(allQuestions.length / questionsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  function handleTestGenerated(test: GeneratedTest) {
    setCurrentTest(test);
    setAllQuestions(test.questions);
    setCurrentPage(0);
    setStep("test");
  }

  function handleContinue(newQuestions: TestQuestion[]) {
    // Add new questions to the list
    const updatedQuestions = [...allQuestions, ...newQuestions];
    setAllQuestions(updatedQuestions);

    // Update the current test with new questions
    if (currentTest) {
      setCurrentTest({
        ...currentTest,
        questions: updatedQuestions
      });
    }

    // Move to the new page with the new questions
    const newPage = Math.floor(allQuestions.length / questionsPerPage);
    setCurrentPage(newPage);
  }

  function handleBackToConfig() {
    setStep("config");
    setCurrentTest(null);
    setAllQuestions([]);
    setCurrentPage(0);
  }

  function handleNextPage() {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }

  function handlePrevPage() {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  if (step === "config") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
            <Sparkle size={20} weight="fill" className="text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Генератор тестів</h2>
            <p className="text-sm text-ink/60">Налаштуйте параметри тесту</p>
          </div>
        </div>

        <TestAIGenerator onTestGenerated={handleTestGenerated} locale={locale} />
      </div>
    );
  }

  if (!currentTest) return null;

  // Create test object for current page
  const pageTest: GeneratedTest = {
    ...currentTest,
    questions: getCurrentPageQuestions()
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToConfig}
          className="flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Назад до налаштувань
        </button>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 disabled:opacity-30"
            >
              <ArrowLeft size={20} />
            </button>

            <span className="text-sm font-semibold text-ink">
              Сторінка {currentPage + 1} з {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 disabled:opacity-30"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {totalPages > 1 && (
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentPage
                  ? "bg-gold scale-y-150"
                  : idx < currentPage
                  ? "bg-moss/50"
                  : "bg-ink/10"
              }`}
              title={`Сторінка ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Current page info */}
      <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-ink">
              Питання {currentPage * questionsPerPage + 1}—{Math.min((currentPage + 1) * questionsPerPage, allQuestions.length)} <span className="text-ink/40">з {allQuestions.length}</span>
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/50">
              {currentPage === 0 ? "Перша партія" : `Партія ${currentPage + 1}`}
            </p>
          </div>
          {currentPage < totalPages - 1 && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-moss">
                <CheckCircle size={18} weight="fill" />
                Завершено
              </div>
              <p className="text-xs text-ink/50">Перейдіть далі →</p>
            </div>
          )}
        </div>
      </div>

      {/* Test session */}
      <TestAISession
        test={pageTest}
        onContinue={handleContinue}
        onNewTest={handleBackToConfig}
        locale={locale}
      />
    </div>
  );
}
