"use client";

import { useState } from "react";
import { Sparkle, Lightning } from "@phosphor-icons/react";
import { useReadingAI } from "./hooks/useReadingAI";
import Loader from "@/components/ui/Loader";
import ReadingComprehension from "./ReadingComprehension";
import ErrorFeedbackModal from "@/components/ui/ErrorFeedbackModal";
import { useLocale } from "@/components/LocaleProvider";

interface ReadingAIGeneratorProps {
  onTextGenerated?: (text: { title: { pl: string; uk: string }; text: { pl: string; uk: string }; topic: string; level: string }) => void;
  locale?: string;
}

type ViewMode = "pl" | "uk" | "dual";

export default function ReadingAIGenerator({ onTextGenerated, locale = "uk" }: ReadingAIGeneratorProps) {
  const { t } = useLocale();
  const { generating, generatedText, error, generateText } = useReadingAI();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [length, setLength] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>("dual");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  async function handleGenerate() {
    if (!topic.trim()) return;

    const success = await generateText(topic, level, length, locale);

    if (success) {
      setRetryCount(0);
      if (generatedText && onTextGenerated) {
        onTextGenerated(generatedText);
      }
    } else if (error) {
      if (retryCount > 0) {
        setShowErrorModal(true);
      }
      setRetryCount((prev) => prev + 1);
    }
  }

  const sizeOptions = [
    { label: t.reading.textSizeMini, value: 100 },
    { label: t.reading.textSizeSmall, value: 150 },
    { label: t.reading.textSizeMedium, value: 200 },
    { label: t.reading.textSizeLarge, value: 300 }
  ];

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkle size={24} weight="fill" className="text-gold" />
          <h3 className="text-xl font-semibold">{t.reading.generateReadingText}</h3>
        </div>
        <p className="mt-2 text-sm text-ink/60">{t.reading.aiReadingTextHint}</p>

        {/* Info about AI content */}
        <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-3">
          <p className="text-xs text-ink/70">
            {t.reading.aiReadingImportant}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Topic Input */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.reading.topic}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.reading.topicPlaceholder}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              disabled={generating}
            />
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.reading.level}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
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

          {/* Length Selection */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.reading.textSize}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setLength(size.value)}
                  disabled={generating}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    length === size.value
                      ? "bg-ink text-paper"
                      : "border border-ink/20 text-ink hover:bg-ink/5"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader label="" />
                {t.common.generating}
              </>
            ) : (
              <>
                <Lightning size={18} weight="fill" />
                {t.reading.generateText}
              </>
            )}
          </button>

          {error && !showErrorModal && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <p className="text-sm font-medium text-terracotta">{error}</p>
              <button
                onClick={handleGenerate}
                className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
              >
                {t.common.retry}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Feedback Modal */}
      <ErrorFeedbackModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={error || t.reading.unknownError}
        context="Reading text generation"
        onRetry={() => {
          setShowErrorModal(false);
          handleGenerate();
        }}
        errorDetails={{
          endpoint: "/api/ai/run",
          payload: { mode: "reading_text_generate", topic, level, length },
          response: error
        }}
      />

      {/* Preview Generated Text */}
      {generatedText && (
        <>
          <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle size={20} weight="fill" className="text-moss" />
                <p className="text-xs uppercase tracking-[0.2em] text-moss">{t.reading.generated}</p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex gap-2">
                {[
                  { id: "pl", label: "PL" },
                  { id: "uk", label: "UKR" },
                  { id: "dual", label: t.reading.bothColumns }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as ViewMode)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      viewMode === mode.id ? "bg-moss text-paper" : "border border-moss/30 text-moss hover:bg-moss/10"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <h4 className="mt-4 text-lg font-semibold">{generatedText.title.uk}</h4>
            <p className="text-sm text-ink/60">{generatedText.title.pl}</p>

            {/* Text Content */}
            <div className="mt-4 rounded-2xl border border-ink/10 bg-paper p-5">
              {viewMode === "dual" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">PL</p>
                    {generatedText.text.pl.split("\n\n").map((paragraph, idx) => (
                      <p key={`pl-${idx}`} className="text-sm leading-6 text-ink/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">UKR</p>
                    {generatedText.text.uk.split("\n\n").map((paragraph, idx) => (
                      <p key={`uk-${idx}`} className="text-sm leading-6 text-ink/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(viewMode === "pl" ? generatedText.text.pl : generatedText.text.uk)
                    .split("\n\n")
                    .map((paragraph, idx) => (
                      <p key={`single-${idx}`} className="text-sm leading-6 text-ink/80">
                        {paragraph}
                      </p>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-ink/60">
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                {generatedText.level}
              </span>
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                {generatedText.topic}
              </span>
            </div>
          </div>

          {/* AI Comprehension Check */}
          <ReadingComprehension
            text={generatedText.text.pl}
            textId={generatedText.id}
            level={generatedText.level}
            locale={locale}
            viewMode={viewMode}
            textTitle={generatedText.title}
            textTopic={generatedText.topic}
          />
        </>
      )}
    </div>
  );
}
