"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  BookOpenText,
  GlobeHemisphereWest,
  Sparkle,
  MaskHappy,
  ArrowLeft,
  ArrowRight
} from "@phosphor-icons/react";

type CompendiumSection = {
  id: string;
  title: string;
  body: string;
  detail: string;
  highlights: string[];
  href: Route;
  tone: string;
  icon: "grammar" | "sites" | "facts" | "culture";
};

type CompendiumCarouselProps = {
  sections: CompendiumSection[];
  ctaLabel: string;
  autoplayLabel: string;
};

const ICONS = {
  grammar: BookOpenText,
  sites: GlobeHemisphereWest,
  facts: Sparkle,
  culture: MaskHappy
} as const;

export default function CompendiumCarousel({
  sections,
  ctaLabel,
  autoplayLabel
}: CompendiumCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const interactionTimeoutRef = useRef<number | null>(null);

  const active = sections[activeIndex] ?? sections[0];

  useEffect(() => {
    if (!cardRef.current) return;
    const update = () => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) setCardWidth(rect.width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !cardWidth) return;
    const handleScroll = () => {
      const gap = 20;
      const nextIndex = Math.round(wrap.scrollLeft / (cardWidth + gap));
      setActiveIndex(Math.max(0, Math.min(sections.length - 1, nextIndex)));
    };
    wrap.addEventListener("scroll", handleScroll, { passive: true });
    return () => wrap.removeEventListener("scroll", handleScroll);
  }, [cardWidth, sections.length]);

  const scrollToIndex = useCallback((index: number) => {
    const wrap = wrapRef.current;
    if (!wrap || !cardWidth) return;
    const gap = 20;
    wrap.scrollTo({ left: index * (cardWidth + gap), behavior: "smooth" });
  }, [cardWidth]);

  useEffect(() => {
    if (isInteracting) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % sections.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isInteracting, sections.length, scrollToIndex]);

  const markInteracting = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 7000);
  };

  const handlePrev = () => {
    markInteracting();
    const next = (activeIndex - 1 + sections.length) % sections.length;
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const handleNext = () => {
    markInteracting();
    const next = (activeIndex + 1) % sections.length;
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const dots = useMemo(
    () =>
      sections.map((section, index) => ({
        id: section.id,
        active: index === activeIndex
      })),
    [sections, activeIndex]
  );

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">{autoplayLabel}</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{active.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{active.detail}</p>
          </div>
          <Link
            href={active.href}
            className="hidden sm:inline-flex items-center rounded-full border border-ink/15 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:bg-ink/5"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {active.highlights.map((item) => (
            <div key={item} className="rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-xs text-ink/70">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="rounded-full border border-ink/15 bg-paper p-2 text-ink/60 hover:text-ink"
              aria-label="Previous"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="rounded-full border border-ink/15 bg-paper p-2 text-ink/60 hover:text-ink"
              aria-label="Next"
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <Link
            href={active.href}
            className="sm:hidden inline-flex items-center rounded-full border border-ink/15 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:bg-ink/5"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div
          ref={wrapRef}
          onPointerDown={markInteracting}
          onWheel={markInteracting}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scrollbar-none"
        >
          {sections.map((section, index) => {
            const Icon = ICONS[section.icon];
            return (
              <Link
                key={section.id}
                href={section.href}
                ref={index === 0 ? cardRef : undefined}
                onClick={markInteracting}
                className={`min-w-[240px] flex-1 snap-start rounded-[28px] border border-ink/10 bg-gradient-to-br ${section.tone} p-5 shadow-soft transition ${
                  index === activeIndex ? "scale-[1.02]" : "opacity-70"
                }`}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-ink/60">
                  {section.title}
                  <Icon size={18} className="text-ink/60" />
                </div>
                <p className="mt-4 text-sm text-ink/70">{section.body}</p>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {dots.map((dot, index) => (
            <button
              key={dot.id}
              onClick={() => {
                markInteracting();
                setActiveIndex(index);
                scrollToIndex(index);
              }}
              className={`h-2.5 rounded-full transition ${
                dot.active ? "w-10 bg-ink" : "w-3 bg-ink/20"
              }`}
              aria-label={`Go to ${dot.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
