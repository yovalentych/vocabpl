"use client";

import { useEffect, useMemo, useState } from "react";
import { SpeakerHigh } from "@phosphor-icons/react";

type SpeakButtonProps = {
  text: string;
  className?: string;
  label?: string;
};

export default function SpeakButton({ text, className, label }: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasApi = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupported(hasApi);
    if (!hasApi) return;

    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list || []);
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  const polishVoice = useMemo(() => {
    if (!voices.length) return null;
    return (
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("pl")) ||
      voices.find((voice) => voice.lang?.toLowerCase() === "pl-pl") ||
      null
    );
  }, [voices]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        const content = String(text || "").trim();
        if (!content || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = "pl-PL";
        if (polishVoice) {
          utterance.voice = polishVoice;
        }
        window.speechSynthesis.speak(utterance);
      }}
      className={
        className ||
        "rounded-full border border-ink/20 bg-paper px-2 py-1 text-ink/60 transition hover:border-ink/30 hover:bg-ink/5"
      }
      aria-label={label || "Озвучити польською"}
      title={label || "Озвучити польською"}
    >
      <SpeakerHigh size={14} weight="fill" />
    </button>
  );
}
