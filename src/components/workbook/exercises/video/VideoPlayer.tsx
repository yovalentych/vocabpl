"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Star, Eye, Clock, BookOpen, Download, Sparkle, CheckCircle, XCircle } from "@phosphor-icons/react";

interface VideoPlayerProps {
  videoId: string;
  onBack: () => void;
}

interface VideoData {
  id: string;
  title: string;
  titleUk: string;
  description: string;
  descriptionUk: string;
  videoUrl: string;
  provider: "youtube" | "vimeo" | "custom";
  duration: number;
  level: string;
  tags: string[];
  transcript?: string;
  transcriptUk?: string;
  transcriptSource?: string;
  vocabulary?: Array<{
    word: string;
    translation: string;
    timestamp: number;
  }>;
  flashcards?: Array<{ front: string; back: string; hint?: string }>;
  mythFacts?: Array<{ statement: string; isTrue: boolean; explanation?: string }>;
  openQuestions?: Array<{ question: string; sampleAnswer?: string; keywords?: string[] }>;
  isFavorite?: boolean;
  isWatched?: boolean;
}

export default function VideoPlayer({ videoId, onBack }: VideoPlayerProps) {
  const { locale } = useLocale();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [truthAnswers, setTruthAnswers] = useState<Record<number, boolean>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({});
  const [openFeedback, setOpenFeedback] = useState<Record<number, string>>({});
  const [openLoading, setOpenLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadVideo() {
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setVideo(data.video);

          // Mark as viewed
          fetch(`/api/video/${videoId}/view`, { method: "POST" }).catch(() => {});
        }
      } catch (error) {
        console.error("Failed to load video:", error);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [videoId]);

  const toggleFavorite = async () => {
    if (!video) return;
    try {
      const res = await fetch(`/api/video/${videoId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !video.isFavorite })
      });
      if (res.ok) {
        setVideo({ ...video, isFavorite: !video.isFavorite });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === "youtube") {
      // Extract video ID from various YouTube URL formats
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
      }
    } else if (provider === "vimeo") {
      // Extract video ID from Vimeo URL
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    return url;
  };

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleTruthAnswer = (idx: number, value: boolean) => {
    setTruthAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const handleOpenCheck = async (idx: number) => {
    if (!video) return;
    const answer = openAnswers[idx] || "";
    if (!answer.trim()) {
      setOpenFeedback((prev) => ({ ...prev, [idx]: locale === "uk" ? "Напишіть відповідь." : "Napisz odpowiedź." }));
      return;
    }
    setOpenLoading((prev) => ({ ...prev, [idx]: true }));
    setOpenFeedback((prev) => ({ ...prev, [idx]: "" }));
    try {
      const question = video.openQuestions?.[idx]?.question || "";
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "video_open_check",
          userInput: JSON.stringify({
            question,
            answer
          }),
          context: JSON.stringify({
            title: video.title,
            level: video.level,
            transcript: video.transcript || "",
            locale,
            sampleAnswer: video.openQuestions?.[idx]?.sampleAnswer || ""
          }),
          provider: "pvs"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.code === "ai_quota"
            ? locale === "uk"
              ? "Ліміт AI вичерпано."
              : "Limit AI został wyczerpany."
            : data?.error || "AI error";
        setOpenFeedback((prev) => ({ ...prev, [idx]: message }));
      } else {
        setOpenFeedback((prev) => ({ ...prev, [idx]: data?.text || "" }));
      }
    } catch {
      setOpenFeedback((prev) => ({
        ...prev,
        [idx]: locale === "uk" ? "Помилка з'єднання." : "Błąd połączenia."
      }));
    } finally {
      setOpenLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
          <p className="text-sm text-ink/60">Завантаження відео...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-12 text-center shadow-soft">
        <p className="text-sm text-ink/60">Відео не знайдено</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 overflow-hidden shadow-soft">
        <div className="relative aspect-video bg-ink">
          <iframe
            src={getEmbedUrl(video.videoUrl, video.provider)}
            title={locale === "uk" ? video.titleUk : video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-ink">
                {locale === "uk" ? video.titleUk : video.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/60">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{Math.floor(video.duration / 60)}хв</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>Переглядів</span>
                </div>
                <div className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                  {video.level}
                </div>
              </div>
            </div>

            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                video.isFavorite
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-ink/20 text-ink/40 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
              }`}
            >
              <Star size={20} weight={video.isFavorite ? "fill" : "regular"} />
            </button>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-ink/70 leading-relaxed">
            {locale === "uk" ? video.descriptionUk : video.description}
          </p>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {video.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/70"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {video.transcript && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={20} weight="bold" className="text-moss" />
              <h3 className="text-lg font-semibold text-ink">Транскрипт</h3>
            </div>
            <span className="text-sm text-ink/60">
              {showTranscript ? "Сховати" : "Показати"}
            </span>
          </button>

          {showTranscript && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {locale === "uk" && video.transcriptUk ? video.transcriptUk : video.transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Flashcards */}
      {video.flashcards && video.flashcards.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkle size={20} weight="bold" className="text-terracotta" />
            <h3 className="text-lg font-semibold text-ink">
              {locale === "uk" ? "Картки для запам'ятовування" : "Fiszki do zapamiętywania"}
            </h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {video.flashcards.map((card, idx) => {
              const flipped = flippedCards.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleCard(idx)}
                  className="group relative min-h-[120px] rounded-2xl border border-ink/10 bg-fog p-4 text-left transition hover:border-ink/30"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {flipped ? (locale === "uk" ? "Відповідь" : "Odpowiedź") : (locale === "uk" ? "Запитання" : "Pytanie")}
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink">
                    {flipped ? card.back : card.front}
                  </p>
                  {card.hint && !flipped && (
                    <p className="mt-2 text-xs text-ink/50">{card.hint}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Truth or Myth */}
      {video.mythFacts && video.mythFacts.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <BookOpen size={20} weight="bold" className="text-moss" />
            <h3 className="text-lg font-semibold text-ink">
              {locale === "uk" ? "Вправа: Правда чи Міф?" : "Ćwiczenie: Prawda czy mit?"}
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {video.mythFacts.map((item, idx) => {
              const answer = truthAnswers[idx];
              const isAnswered = typeof answer === "boolean";
              const isCorrect = isAnswered ? answer === item.isTrue : false;
              return (
                <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                  <p className="text-sm text-ink/80">{item.statement}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTruthAnswer(idx, true)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        answer === true ? "bg-ink text-paper" : "border border-ink/20 text-ink/60"
                      }`}
                    >
                      {locale === "uk" ? "Правда" : "Prawda"}
                    </button>
                    <button
                      onClick={() => handleTruthAnswer(idx, false)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        answer === false ? "bg-ink text-paper" : "border border-ink/20 text-ink/60"
                      }`}
                    >
                      {locale === "uk" ? "Міф" : "Mit"}
                    </button>
                    {isAnswered && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          isCorrect ? "bg-moss/20 text-moss" : "bg-terracotta/20 text-terracotta"
                        }`}
                      >
                        {isCorrect ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                        {isCorrect ? (locale === "uk" ? "Правильно" : "Dobrze") : (locale === "uk" ? "Помилка" : "Błąd")}
                      </span>
                    )}
                  </div>
                  {isAnswered && item.explanation && (
                    <p className="mt-2 text-xs text-ink/60">{item.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Open Questions */}
      {video.openQuestions && video.openQuestions.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkle size={20} weight="bold" className="text-gold" />
            <h3 className="text-lg font-semibold text-ink">
              {locale === "uk" ? "Відкриті відповіді" : "Odpowiedzi otwarte"}
            </h3>
          </div>
          <div className="mt-4 space-y-4">
            {video.openQuestions.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                <p className="text-sm font-semibold text-ink">{item.question}</p>
                <textarea
                  value={openAnswers[idx] || ""}
                  onChange={(event) => setOpenAnswers((prev) => ({ ...prev, [idx]: event.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                  rows={3}
                  placeholder={locale === "uk" ? "Відповідь..." : "Odpowiedź..."}
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCheck(idx)}
                    disabled={openLoading[idx]}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
                  >
                    {openLoading[idx]
                      ? locale === "uk"
                        ? "AI перевіряє..."
                        : "AI sprawdza..."
                      : locale === "uk"
                        ? "Перевірити з AI"
                        : "Sprawdź z AI"}
                  </button>
                  {item.sampleAnswer && (
                    <span className="text-xs text-ink/50">
                      {locale === "uk" ? "Є приклад відповіді" : "Jest przykładowa odpowiedź"}
                    </span>
                  )}
                </div>
                {openFeedback[idx] && (
                  <div className="mt-3 rounded-2xl border border-ink/10 bg-paper/70 p-3 text-xs text-ink/70 whitespace-pre-line">
                    {openFeedback[idx]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {video.vocabulary && video.vocabulary.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <button
            onClick={() => setShowVocabulary(!showVocabulary)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Download size={20} weight="bold" className="text-gold" />
              <h3 className="text-lg font-semibold text-ink">
                Корисні слова ({video.vocabulary.length})
              </h3>
            </div>
            <span className="text-sm text-ink/60">
              {showVocabulary ? "Сховати" : "Показати"}
            </span>
          </button>

          {showVocabulary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {video.vocabulary.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-ink/10 bg-fog p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-moss">{item.word}</p>
                      <p className="mt-1 text-sm text-ink/70">{item.translation}</p>
                    </div>
                    <span className="text-xs text-ink/40">
                      {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
