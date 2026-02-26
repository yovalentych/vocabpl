"use client";

import { useState } from "react";
import { Sparkle, Lightning, Sliders, Book } from "@phosphor-icons/react";
import GrammarTopicsModal from "./GrammarTopicsModal";
import Loader from "@/components/ui/Loader";
import ErrorFeedbackModal from "@/components/ui/ErrorFeedbackModal";
import { safeJSONParse } from "@/lib/json-utils";
import { validateGeneratedContent } from "@/lib/difficulty";
import { useLocale } from "@/components/LocaleProvider";

export interface TestQuestion {
  id: string;
  type: "single" | "multiple" | "fillgap" | "open";
  question: { pl: string; uk: string };
  correctAnswer: string | string[];
  options?: { id: string; pl: string; uk: string }[];
  gapSentence?: { pl: string; uk: string };
  explanation?: { pl: string; uk: string };
  testedRule?: string; // Technical description of tested grammar rule
}

export interface GeneratedTest {
  id: string;
  questions: TestQuestion[];
  topic: string;
  focus: string[];
  grammarTopics: string[];
  questionCount: number;
  level: string;
  createdAt: string;
}

interface TestAIGeneratorProps {
  onTestGenerated?: (test: GeneratedTest) => void;
  locale?: string;
}

type FocusArea = "grammar" | "vocabulary" | "orthography" | "word-formation";
type QuestionType = "single" | "multiple" | "fillgap" | "open";

export default function TestAIGenerator({ onTestGenerated, locale = "uk" }: TestAIGeneratorProps) {
  const { t } = useLocale();
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState<FocusArea>("grammar");
  const [grammarTopics, setGrammarTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(6);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["single", "multiple", "fillgap"]);
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("A2");

  const [showGrammarModal, setShowGrammarModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  function selectFocus(area: FocusArea) {
    setFocus(area);
  }

  function toggleQuestionType(type: QuestionType) {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError(t.tests.enterTopic);
      return;
    }

    if (questionTypes.length === 0) {
      setError(t.tests.selectAtLeastOneType);
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const payload = {
        mode: "test_generate",
        userInput: JSON.stringify({
          topic,
          focus: [focus], // Convert single focus to array for API
          grammarTopics,
          questionCount,
          questionTypes,
          level
        }),
        context: JSON.stringify({ uiLanguage: locale, level })
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t.tests.generateError);
      }

      const data = await res.json();

      if (!data.text) {
        throw new Error(t.tests.emptyAIResponse);
      }

      // Use safe JSON parser with error recovery
      const parseResult = safeJSONParse(data.text);

      if (!parseResult.success) {
        console.error("JSON parse error:", parseResult.error);
        console.error("Received text:", data.text);
        throw new Error(t.tests.invalidJSONFromAI.replace("{error}", parseResult.error || "Unknown"));
      }

      const parsed = parseResult.data;

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error(t.tests.invalidResponseMissingQuestions);
      }

      if (parsed.questions.length === 0) {
        throw new Error(t.tests.noQuestionsGenerated);
      }

      // Validate content quality
      const validation = validateGeneratedContent({
        content: parsed,
        level: level as any,
        exerciseType: "test"
      });

      // Log validation results
      console.log("📊 Test content validation:", {
        valid: validation.valid,
        score: validation.score,
        metrics: validation.metrics
      });

      if (validation.errors.length > 0) {
        console.warn("⚠️ Content quality issues:", validation.errors);
      }

      // If quality is too low, reject and retry
      if (!validation.valid || validation.score < 0.6) {
        console.error("❌ Test quality too low, rejecting...");

        // Log to backend for monitoring
        fetch("/api/admin/content-quality-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "test_generate",
            level,
            topic,
            focus,
            grammarTopics,
            validation: {
              valid: validation.valid,
              score: validation.score,
              errors: validation.errors.map(e => e.message)
            },
            metrics: validation.metrics
          })
        }).catch(() => null);

        throw new Error(t.tests.qualityTooLow.replace("{score}", (validation.score * 100).toFixed(0)));
      }

      const generatedTest: GeneratedTest = {
        id: `ai-test-${Date.now()}`,
        questions: parsed.questions,
        topic,
        focus: [focus], // Store as array for consistency
        grammarTopics,
        questionCount,
        level,
        createdAt: new Date().toISOString()
      };

      // Reset retry count on success
      setRetryCount(0);

      if (onTestGenerated) {
        onTestGenerated(generatedTest);
      }
    } catch (err) {
      console.error("Generate test error:", err);
      const errorMessage = err instanceof Error ? err.message : t.tests.generateError;
      setError(errorMessage);

      // Show error modal on second attempt
      if (retryCount > 0) {
        setErrorDetails({
          endpoint: "/api/ai/run",
          payload: { mode: "test_generate", topic, focus, grammarTopics, questionCount, questionTypes, level },
          response: err instanceof Error ? err.stack : String(err)
        });
        setShowErrorModal(true);
      }

      setRetryCount((prev) => prev + 1);
    } finally {
      setGenerating(false);
    }
  }

  const focusOptions: { id: FocusArea; label: string; icon: string }[] = [
    { id: "grammar", label: t.tests.focusGrammar, icon: "📚" },
    { id: "vocabulary", label: t.tests.focusVocabulary, icon: "📖" },
    { id: "orthography", label: t.tests.focusOrthography, icon: "✍️" },
    { id: "word-formation", label: t.tests.focusWordFormation, icon: "🔤" }
  ];

  const questionTypeOptions: { id: QuestionType; label: string; desc: string }[] = [
    { id: "single", label: t.tests.typesSingleLabel, desc: t.tests.typesSingleDesc },
    { id: "multiple", label: t.tests.typesMultipleLabel, desc: t.tests.typesMultipleDesc },
    { id: "fillgap", label: t.tests.typesFillgapLabel, desc: t.tests.typesFillgapDesc },
    { id: "open", label: t.tests.typesOpenLabel, desc: t.tests.typesOpenDesc }
  ];

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkle size={24} weight="fill" className="text-gold" />
          <h3 className="text-xl font-semibold">{t.tests.aiGeneratorTitle}</h3>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          {t.tests.aiGeneratorSubtitle}
        </p>

        {/* Info about AI content */}
        <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-3">
          <p className="text-xs text-ink/70">
            {t.tests.aiContentInfo}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {/* Topic Input */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.tests.topicLabel}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.tests.topicPlaceholder}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2.5 text-sm focus:border-moss/40 focus:outline-none"
              disabled={generating}
            />
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.tests.focusLabel}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectFocus(option.id)}
                  disabled={generating}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    focus === option.id
                      ? "bg-moss text-paper"
                      : "border border-ink/20 text-ink hover:bg-ink/5"
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/50">
              {t.tests.focusHint}
            </p>
          </div>

          {/* Grammar Topics */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.tests.grammarTopicsLabel}
            </label>
            <button
              onClick={() => setShowGrammarModal(true)}
              disabled={generating}
              className="mt-2 flex w-full items-center justify-between rounded-2xl border border-ink/20 bg-paper px-4 py-2.5 text-sm transition hover:border-ink/30"
            >
              <span className="flex items-center gap-2 text-ink/70">
                <Book size={18} />
                {grammarTopics.length > 0
                  ? t.tests.grammarTopicsSelected.replace("{count}", String(grammarTopics.length)).replace("{max}", "5")
                  : t.tests.grammarTopicsSelect}
              </span>
              <Sliders size={18} className="text-ink/40" />
            </button>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.tests.questionTypesLabel}
            </label>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {questionTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleQuestionType(option.id)}
                  disabled={generating}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    questionTypes.includes(option.id)
                      ? "border-moss bg-moss/10"
                      : "border-ink/10 bg-paper/60 hover:border-ink/20"
                  }`}
                >
                  <p className={`text-sm font-semibold ${questionTypes.includes(option.id) ? "text-moss" : "text-ink"}`}>
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.tests.levelLabel}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["A1", "A2", "B1", "B2", "C1"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  disabled={generating}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    level === lvl
                      ? "bg-ink text-paper"
                      : "border border-ink/20 text-ink hover:bg-ink/5"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || questionTypes.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader label="" />
                {t.tests.generatingTest}
              </>
            ) : (
              <>
                <Lightning size={18} weight="fill" />
                {t.tests.generateTest}
              </>
            )}
          </button>

          {error && !showErrorModal && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <p className="text-sm font-medium text-terracotta">{error}</p>
              {retryCount > 0 && (
                <button
                  onClick={handleGenerate}
                  className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Feedback Modal */}
      <ErrorFeedbackModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={error}
        context={t.tests.contextLabel}
        onRetry={() => {
          setShowErrorModal(false);
          handleGenerate();
        }}
        errorDetails={errorDetails}
      />

      {/* Grammar Topics Modal */}
      <GrammarTopicsModal
        isOpen={showGrammarModal}
        onClose={() => setShowGrammarModal(false)}
        selectedTopics={grammarTopics}
        maxSelection={5}
        onToggleTopic={(topicId) => {
          setGrammarTopics((prev) =>
            prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
          );
        }}
        onClearAll={() => setGrammarTopics([])}
        onSelectAll={() => {
          // Select all available topics from GrammarTopicsModal
          setGrammarTopics([
            "noun-cases", "noun-gender", "noun-number", "noun-declension",
            "adj-comparison", "adj-agreement", "adj-declension",
            "pron-personal", "pron-possessive", "pron-demonstrative", "pron-interrogative", "pron-reflexive",
            "verb-present", "verb-past", "verb-future", "verb-aspect", "verb-imperative", "verb-conditional",
            "verb-participle", "verb-gerund", "verb-conjugation", "verb-reflexive",
            "adv-comparison", "adv-formation",
            "num-cardinal", "num-ordinal", "num-collective",
            "prep-cases", "prep-location", "prep-time",
            "conj-coordinating", "conj-subordinating",
            "syntax-word-order", "syntax-complex", "syntax-negation",
            "ortho-capitalization", "ortho-punctuation", "ortho-spelling", "ortho-diacritics",
            "word-prefixes", "word-suffixes", "word-compound", "word-diminutives"
          ]);
        }}
      />
    </div>
  );
}
