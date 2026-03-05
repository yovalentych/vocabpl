'use client';

import { useState } from 'react';

/* ─── Types ─────────────────────────────────────────── */

type Segment = { text: string; hl: boolean };
type ExampleWord = { segments: Segment[] };

type Example = {
  uk: ExampleWord;
  pl: ExampleWord;
  meaning?: string;
};

type ExceptionBlock = {
  condition: string;
  result: string;
  examples: Example[];
};

type PhonemeRule = {
  id: string;
  tabLabel: string;
  ukSound: string;
  plGrapheme: string;
  note: string;
  extra?: string;
  examples: Example[];
  exception?: ExceptionBlock;
};

/* ─── Data builder ───────────────────────────────────── */

function w(word: string, highlight: string): ExampleWord {
  if (!highlight) return { segments: [{ text: word, hl: false }] };
  const esc = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${esc})`, 'i');
  const parts = word.split(regex).filter(p => p.length > 0);
  return { segments: parts.map(part => ({ text: part, hl: regex.test(part) })) };
}

/* ─── Rules ──────────────────────────────────────────── */

const RULES: PhonemeRule[] = [
  {
    id: 'y',
    tabLabel: '[И] → y',
    ukSound: 'И / У',
    plGrapheme: 'y / ó',
    note: 'Де в укр. є У або І — в польськ. може бути y або ó (обидва читаються як [У]).',
    examples: [
      { uk: w('ТУТ', 'У'),  pl: w('TU', 'U'),   meaning: 'тут' },
      { uk: w('СІЛЬ', 'І'), pl: w('SÓL', 'Ó'),  meaning: 'сіль' },
      { uk: w('ТИ', 'И'),   pl: w('TY', 'Y'),    meaning: 'ти' },
    ],
  },
  {
    id: 'sz',
    tabLabel: '[Ш] → SZ',
    ukSound: 'Ш',
    plGrapheme: 'SZ',
    note: 'Де в укр. слові є Ш — в польськ. пиши SZ.',
    extra: 'SZ також є закінченням дієслова теп. часу для форми ТИ.',
    examples: [
      { uk: w('МИША', 'Ш'),   pl: w('MYSZ', 'SZ'),   meaning: 'миша' },
      { uk: w('робиШ', 'Ш'), pl: w('robiSZ', 'SZ'), meaning: 'ти робиш' },
    ],
  },
  {
    id: 'cz',
    tabLabel: '[Ч] → CZ',
    ukSound: 'Ч / Щ',
    plGrapheme: 'CZ / SZCZ',
    note: 'Де в укр. є Ч — пол. CZ. Укр. Щ = CZ + SZ = SZCZ [ШЧ].',
    examples: [
      { uk: w('ЧИТАТИ', 'Ч'), pl: w('CZYTAĆ', 'CZ'),   meaning: 'читати' },
      { uk: w('БОРЩ', 'Щ'),   pl: w('BARSZCZ', 'SZCZ'), meaning: 'борщ' },
      { uk: w('ЩЕ', 'Щ'),     pl: w('JESZCZE', 'SZCZ'), meaning: 'ще' },
    ],
  },
  {
    id: 'rz',
    tabLabel: '[Ж] → Ż/RZ',
    ukSound: 'Ж',
    plGrapheme: 'Ż або RZ',
    note: 'Польський [Ж] пишеться як Ż або RZ — обидва читаються однаково.',
    extra: '⚠️ Після глухої приголосної: RZ читається як [Ш]!',
    examples: [
      { uk: w('МОЖНА', 'Ж'), pl: w('można', 'ż'),   meaning: 'можна' },
      { uk: w('МОРЕ', ''),    pl: w('morze', 'rz'),  meaning: 'море' },
    ],
    exception: {
      condition: 'Глуха приголосна + RZ',
      result: '[Ш]',
      examples: [
        { uk: w('КШИШТОФ', 'КШ'), pl: w('Krzysztof', 'Krz'), meaning: "ім'я" },
      ],
    },
  },
];

/* ─── Accent config (static class strings for Tailwind) ─ */

type Accent = {
  text: string;
  bg: string;
  border: string;
  mark: string;
  tabIdle: string;
  tabActive: string;
  dot: string;
};

const ACCENT: Record<string, Accent> = {
  y: {
    text:      'text-[#2563eb]',
    bg:        'bg-[#eff6ff]',
    border:    'border-[#93c5fd]',
    mark:      'bg-[#bfdbfe] text-[#1e3a8a]',
    tabIdle:   'border-[#93c5fd] text-[#2563eb] hover:bg-[#eff6ff]',
    tabActive: 'bg-[#2563eb] text-white border-[#2563eb]',
    dot:       'bg-[#2563eb]',
  },
  sz: {
    text:      'text-moss',
    bg:        'bg-moss/10',
    border:    'border-moss/40',
    mark:      'bg-moss/30 text-moss',
    tabIdle:   'border-moss/40 text-moss hover:bg-moss/10',
    tabActive: 'bg-moss text-paper border-moss',
    dot:       'bg-moss',
  },
  cz: {
    text:      'text-[#b45309]',
    bg:        'bg-gold/10',
    border:    'border-gold/50',
    mark:      'bg-gold/60 text-[#78350f]',
    tabIdle:   'border-gold/50 text-[#b45309] hover:bg-gold/10',
    tabActive: 'bg-gold text-[#78350f] border-gold',
    dot:       'bg-gold',
  },
  rz: {
    text:      'text-terracotta',
    bg:        'bg-terracotta/10',
    border:    'border-terracotta/40',
    mark:      'bg-terracotta/30 text-terracotta',
    tabIdle:   'border-terracotta/40 text-terracotta hover:bg-terracotta/10',
    tabActive: 'bg-terracotta text-paper border-terracotta',
    dot:       'bg-terracotta',
  },
};

/* ─── Sub-components ─────────────────────────────────── */

function WordDisplay({
  word,
  markClass,
  active,
}: {
  word: ExampleWord;
  markClass: string;
  active: boolean;
}) {
  return (
    <span className="font-mono text-base sm:text-lg font-bold tracking-widest">
      {word.segments.map((seg, i) =>
        seg.hl && active ? (
          <mark key={i} className={`${markClass} px-0.5 rounded not-italic`}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

function Arrow({ color }: { color: string }) {
  return <span className={`text-xl font-bold ${color} opacity-60`}>→</span>;
}

/* ─── Main component ─────────────────────────────────── */

export function PhonemeLifehackSection() {
  const [activeId, setActiveId]     = useState('y');
  const [hoveredEx, setHoveredEx]   = useState<number | null>(null);
  const [hoveredExc, setHoveredExc] = useState<number | null>(null);

  const rule = RULES.find(r => r.id === activeId)!;
  const ac   = ACCENT[activeId];

  function selectRule(id: string) {
    setActiveId(id);
    setHoveredEx(null);
    setHoveredExc(null);
  }

  return (
    <article className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft">

      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-6">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${ac.border} ${ac.bg} text-lg`}>
          🔤
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
            Як писати і як чути?
          </h2>
          <p className="text-sm text-ink/50 mt-0.5">
            Лайфхаки для читання та написання польських слів через українську
          </p>
        </div>
      </div>

      {/* ── Rule tabs ── */}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist">
        {RULES.map(r => {
          const a = ACCENT[r.id];
          const isActive = r.id === activeId;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectRule(r.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition-all duration-200 ${
                isActive ? a.tabActive : `bg-transparent ${a.tabIdle}`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-current opacity-70' : a.dot}`} />
              {r.tabLabel}
            </button>
          );
        })}
      </div>

      {/* ── Rule diagram card ── */}
      <div
        key={activeId}
        className={`rounded-2xl border ${ac.border} ${ac.bg} p-5 mb-5 transition-all duration-300`}
      >
        {/* Flow: UK → PL */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          {/* Ukrainian sound box */}
          <div className={`rounded-xl border-2 ${ac.border} bg-paper/90 px-4 py-2 text-center min-w-[80px]`}>
            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-0.5">Укр. звук</p>
            <p className={`text-2xl font-black font-mono ${ac.text} leading-none`}>{rule.ukSound}</p>
          </div>

          <Arrow color={ac.text} />

          {/* Polish grapheme box */}
          <div className={`rounded-xl border-2 ${ac.border} bg-paper/90 px-4 py-2 text-center min-w-[80px]`}>
            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-0.5">Пол. буква</p>
            <p className={`text-2xl font-black font-mono ${ac.text} leading-none`}>{rule.plGrapheme}</p>
          </div>

          {/* Connector line decoration */}
          <div className={`hidden sm:flex ml-2 h-[2px] flex-1 max-w-[60px] rounded-full opacity-30 ${ac.dot}`} />
        </div>

        {/* Note */}
        <p className="text-sm text-ink/70 leading-relaxed">{rule.note}</p>
        {rule.extra && (
          <p className={`text-sm font-semibold ${ac.text} mt-2`}>{rule.extra}</p>
        )}
      </div>

      {/* ── Examples ── */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35 mb-2 font-semibold">
          Приклади — наведи або натисни для підсвічування
        </p>
        <div className="space-y-2">
          {rule.examples.map((ex, i) => {
            const isActive = hoveredEx === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredEx(i)}
                onMouseLeave={() => setHoveredEx(null)}
                onClick={() => setHoveredEx(isActive ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setHoveredEx(isActive ? null : i)}
                className={`flex items-center gap-3 rounded-xl border cursor-pointer select-none px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? `${ac.border} ${ac.bg} shadow-sm scale-[1.01]`
                    : 'border-ink/10 bg-paper/40 hover:border-ink/20 hover:bg-paper/60'
                }`}
              >
                <WordDisplay word={ex.uk} markClass={ac.mark} active={isActive} />
                <span className={`text-lg ${isActive ? ac.text : 'text-ink/25'} transition-colors`}>→</span>
                <WordDisplay word={ex.pl} markClass={ac.mark} active={isActive} />
                {ex.meaning && (
                  <span className="ml-auto text-xs text-ink/35 italic shrink-0">{ex.meaning}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Exception block ── */}
      {rule.exception && (
        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-black text-terracotta uppercase tracking-wider">NB! Виняток</span>
          </div>
          <p className="text-sm text-ink/70 mb-3">
            <span className="font-semibold">{rule.exception.condition}</span>
            {' → читається як '}
            <span className="font-black text-terracotta text-base">{rule.exception.result}</span>
          </p>
          <div className="space-y-2">
            {rule.exception.examples.map((ex, i) => {
              const isActive = hoveredExc === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredExc(i)}
                  onMouseLeave={() => setHoveredExc(null)}
                  onClick={() => setHoveredExc(isActive ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setHoveredExc(isActive ? null : i)}
                  className={`flex items-center gap-3 rounded-xl border cursor-pointer select-none px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'border-terracotta/50 bg-terracotta/15 scale-[1.01]'
                      : 'border-terracotta/20 bg-terracotta/5 hover:border-terracotta/35'
                  }`}
                >
                  <WordDisplay
                    word={ex.uk}
                    markClass="bg-terracotta/30 text-terracotta"
                    active={isActive}
                  />
                  <span className={`text-lg transition-colors ${isActive ? 'text-terracotta' : 'text-ink/25'}`}>→</span>
                  <WordDisplay
                    word={ex.pl}
                    markClass="bg-terracotta/30 text-terracotta"
                    active={isActive}
                  />
                  {ex.meaning && (
                    <span className="ml-auto text-xs text-ink/35 italic shrink-0">{ex.meaning}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
