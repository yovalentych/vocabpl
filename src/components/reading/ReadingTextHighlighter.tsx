"use client";

import { useState } from "react";
import { Lightbulb } from "@phosphor-icons/react";

interface ReadingTextHighlighterProps {
  text: string;
  level: string;
  locale?: string;
  onExplainRequest: (fragment: string) => void;
  viewMode?: "pl" | "uk" | "dual";
}

export default function ReadingTextHighlighter({
  text,
  level,
  locale = "uk",
  onExplainRequest,
  viewMode = "pl"
}: ReadingTextHighlighterProps) {
  const [selectedText, setSelectedText] = useState("");
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  function handleTextSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && text.length < 200) {
      setSelectedText(text);

      // Get selection position for tooltip
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setTooltipPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      }
    } else {
      setSelectedText("");
      setTooltipPos(null);
    }
  }

  function handleExplain() {
    if (selectedText) {
      onExplainRequest(selectedText);
      setSelectedText("");
      setTooltipPos(null);

      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  }

  function handleClickOutside() {
    setSelectedText("");
    setTooltipPos(null);
  }

  return (
    <div className="relative" onClick={handleClickOutside}>
      {/* Text Content with Selection */}
      <div
        onMouseUp={handleTextSelection}
        className="select-text space-y-5 cursor-text"
      >
        {text.split("\n\n").map((paragraph, idx) => (
          <p key={`para-${idx}`} className="text-base leading-7 text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Tooltip */}
      {selectedText && tooltipPos && (
        <div
          className="fixed z-10"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleExplain}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-4 py-2 text-sm font-semibold text-paper shadow-lg transition hover:bg-gold/90"
          >
            <Lightbulb size={16} weight="fill" />
            Пояснити
          </button>
        </div>
      )}
    </div>
  );
}
