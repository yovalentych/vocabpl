'use client';

import { useState } from 'react';

/* ─── Types ─────────────────────────────────────────── */

type Segment = { text: string; hl: boolean };
type ExampleWord = { segments: Segment[] };

type Example = {
  uk: ExampleWord;
  pl: ExampleWord;
  /** short translation / note shown on the right */
  meaning?: string;
  /** optional phonetic transcription shown in brackets */
  phonetic?: string;
};

type ExceptionBlock = {
  condition: string;
  result: string;
  /** list of voiceless consonant chars to display */
  voicelessChars?: string[];
  /** prefix mnemonic (e.g. PRZY-/PRZE-) */
  prefixNote?: {
    title: string;
    popNote: string; // informal cultural note
    examples: Example[];
  };
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
    note:
      'Де в укр. слові є У або І — в польськ. може бути y або ó (обидва читаються як [У]). Польська y сама по собі читається як укр. И.',
    examples: [
      { uk: w('ТИ', 'И'),     pl: w('TY', 'Y'),     meaning: 'ти' },
      { uk: w('МИ', 'И'),     pl: w('MY', 'Y'),      meaning: 'ми' },
      { uk: w('ТУТ', 'У'),   pl: w('TU', 'U'),      meaning: 'тут' },
      { uk: w('СІЛЬ', 'І'),  pl: w('SÓL', 'Ó'),     meaning: 'сіль' },
      { uk: w('РИБА', 'И'),  pl: w('RYBA', 'Y'),    meaning: 'риба' },
      { uk: w('МИТИ', 'И'),  pl: w('MYĆ', 'Y'),     meaning: 'мити' },
      { uk: w('МИ́ЛО', 'И'), pl: w('MYDŁO', 'Y'),   meaning: 'мило' },
    ],
  },
  {
    id: 'sz',
    tabLabel: '[Ш] → SZ',
    ukSound: 'Ш',
    plGrapheme: 'SZ',
    note:
      'Де в укр. слові є Ш — в польськ. пиши SZ. Це стосується і коренів, і закінчень.',
    extra: 'Бонус: SZ — це також закінчення дієслова теп. часу для форми ТИ (аналог укр. -ШЕ).',
    examples: [
      { uk: w('МИША', 'Ш'),    pl: w('MYSZ', 'SZ'),    meaning: 'миша' },
      { uk: w('ШКОЛА', 'Ш'),   pl: w('SZKOŁA', 'SZ'),  meaning: 'школа' },
      { uk: w('ШУБА', 'Ш'),    pl: w('SZUBA', 'SZ'),   meaning: 'шуба' },
      { uk: w('НАША', 'Ш'),    pl: w('NASZA', 'SZ'),   meaning: 'наша' },
      { uk: w('робиШ', 'Ш'),   pl: w('robiSZ', 'SZ'),  meaning: 'ти робиш' },
      { uk: w('слухаєШ', 'Ш'), pl: w('słuchaSZ', 'SZ'), meaning: 'ти слухаєш' },
    ],
  },
  {
    id: 'cz',
    tabLabel: '[Ч] → CZ',
    ukSound: 'Ч / Щ',
    plGrapheme: 'CZ / SZCZ',
    note:
      'Де в укр. є Ч — пиши CZ. Де є Щ — пиши SZCZ (= CZ + SZ, читається [ШЧ]).',
    examples: [
      { uk: w('ЧАС', 'Ч'),     pl: w('CZAS', 'CZ'),    meaning: 'час' },
      { uk: w('ЧИТАТИ', 'Ч'),  pl: w('CZYTAĆ', 'CZ'),  meaning: 'читати' },
      { uk: w('ЧОРНИЙ', 'Ч'),  pl: w('CZARNY', 'CZ'),  meaning: 'чорний' },
      { uk: w('КЛЮЧ', 'Ч'),    pl: w('KLUCZ', 'CZ'),   meaning: 'ключ' },
      { uk: w('БОРЩ', 'Щ'),    pl: w('BARSZCZ', 'SZCZ'), meaning: 'борщ' },
      { uk: w('ЩЕ', 'Щ'),      pl: w('JESZCZE', 'SZCZ'), meaning: 'ще' },
      { uk: w('ДОЩ', 'Щ'),     pl: w('DESZCZ', 'SZCZ'), meaning: 'дощ' },
    ],
  },
  {
    id: 'rz',
    tabLabel: '[Ж] → Ż/RZ',
    ukSound: 'Ж',
    plGrapheme: 'Ż або RZ',
    note:
      'Польський [Ж] пишеться як Ż або RZ — звучать однаково. Ż частіше в корені, RZ — у приставках і суфіксах.',
    extra: '⚠️ Після глухої приголосної: RZ читається як [Ш], а не [Ж]!',
    examples: [
      { uk: w('МОЖНА', 'Ж'),    pl: w('można', 'ż'),    meaning: 'можна' },
      { uk: w('ЖИТИ', 'Ж'),     pl: w('żyć', 'ż'),      meaning: 'жити' },
      { uk: w('ЖОВТИЙ', 'Ж'),   pl: w('żółty', 'ż'),    meaning: 'жовтий' },
      { uk: w('СТРАЖ', 'Ж'),    pl: w('straŻak', 'Ż'),  meaning: 'пожежник ← СТРАЖ+Ж=Ż' },
      { uk: w('МОРЕ', ''),       pl: w('morze', 'rz'),   meaning: 'море — rz = [Ж]' },
      { uk: w('РІЖУ', 'Ж'),     pl: w('rzezać', 'rz'),  meaning: 'різати' },
    ],
    exception: {
      condition: 'Глуха приголосна + RZ',
      result: '[Ш]',
      voicelessChars: ['П', 'Т', 'К', 'С', 'Ф', 'Х', 'Ц', 'Ч', 'Ш'],
      prefixNote: {
        title: 'Запам\'ятай через PRZY- і PRZE-',
        popNote:
          'Саме тому поляків неформально (і не дуже політкоректно) називають "пшеки" — їхні найпоширеніші приставки PRZY- і PRZE- звучать [ПШИ] і [ПШЕ].',
        examples: [
          {
            uk: w('ПРИ-', 'ПР'),
            pl: w('PRZY-', 'Rz'),
            meaning: 'при-',
            phonetic: '[ПШИ-]',
          },
          {
            uk: w('ПРЕ-/ПЕРЕ-', 'ПР'),
            pl: w('PRZE-', 'Rz'),
            meaning: 'пре-/пере-',
            phonetic: '[ПШЕ-]',
          },
        ],
      },
      examples: [
        {
          uk: w('КШИШТОФ', 'КШ'),
          pl: w('Krzysztof', 'Krz'),
          meaning: "ім'я",
          phonetic: '[КШиштоф]',
        },
        {
          uk: w('ХРІН', 'ХР'),
          pl: w('chrzan', 'chrz'),
          meaning: 'хрін',
          phonetic: '[хШан]',
        },
        {
          uk: w('ПШЕНИЦЯ', 'ПШ'),
          pl: w('pszenica', 'psz'),
          meaning: 'пшениця',
          phonetic: '[пШеніца]',
        },
      ],
    },
  },
  {
    id: 'l',
    tabLabel: 'Ł → [В]',
    ukSound: 'В',
    plGrapheme: 'Ł',
    note:
      'Польська Ł звучить як укр. В (або як англ. W). Ця буква НЕ схожа на звичайну L — це повністю інший звук. Не плутай!',
    extra: 'У кінці після голосної Ł часто дає [У/В]: STÓŁ → [стуВ], PIŁKA → [піВка].',
    examples: [
      { uk: w('ДОЛОНЯ', 'Л'),    pl: w('DŁOŃ', 'Ł'),      meaning: 'долоня',           phonetic: '[дВонь]' },
      { uk: w('ХЛОПЕЦЬ', 'ХЛ'), pl: w('CHŁOPIEC', 'Ł'),  meaning: 'хлопець',          phonetic: '[хВопець]' },
      { uk: w('МАВПА', 'АВ'),   pl: w('MAŁPA', 'Ł'),      meaning: 'мавпа',            phonetic: '[маВпа]' },
      { uk: w('КУЛЬКА', ''),     pl: w('PIŁKA', 'Ł'),      meaning: 'кулька/м\'яч',     phonetic: '[піВка]' },
      { uk: w('ЛЕГКИЙ', ''),     pl: w('ŁATWY', 'Ł'),      meaning: 'легкий/простий',   phonetic: '[Ватвий]' },
      { uk: w('СТІЛ', ''),       pl: w('STÓŁ', 'Ł'),       meaning: 'стіл',             phonetic: '[стуВ]' },
      { uk: w('ЛОДЗЬ', ''),      pl: w('ŁÓDŹ', 'Ł'),       meaning: 'місто Лодзь',      phonetic: '[Вудзь]' },
    ],
  },
  {
    id: 'an',
    tabLabel: 'Ą / Ę носові',
    ukSound: 'ОН / ЕН',
    plGrapheme: 'Ą / Ę',
    note:
      'Ą і Ę — носові голосні, яких немає в укр. Спрощено: Ą ≈ [ОН] або [О], Ę ≈ [ЕН] або [Е]. Перед дзвінкими приголосними носовий елемент [Н/М] добре чутний, у кінці слова — слабкий.',
    extra: 'Ą у кінці слова та перед Ł → просто [О]: SĄ [со], MAJĄ [маю].',
    examples: [
      { uk: w('ЧОЛОВІК', ''),  pl: w('MĄŻ', 'Ą'),     meaning: 'чоловік',                phonetic: '[монж]' },
      { uk: w('ЗУБ', ''),      pl: w('ZĄB', 'Ą'),      meaning: 'зуб',                    phonetic: '[зомб]' },
      { uk: w('РУКА', ''),     pl: w('RĘKA', 'Ę'),     meaning: 'рука',                   phonetic: '[рєнка]' },
      { uk: w('МОВА', ''),     pl: w('JĘZYK', 'Ę'),    meaning: 'мова/язик',              phonetic: '[єнзик]' },
      { uk: w('П\'ЯТЬ', ''),  pl: w('PIĘĆ', 'IĘ'),    meaning: 'п\'ять',                 phonetic: '[пєнч]' },
      { uk: w('БУДУ', ''),     pl: w('BĘDĘ', 'Ę'),     meaning: 'я буду',                 phonetic: '[бєндє]' },
      { uk: w('ВОНИ Є', ''),   pl: w('SĄ', 'Ą'),       meaning: 'вони є',                 phonetic: '[со]' },
      { uk: w('СЕБЕ', ''),     pl: w('SIĘ', 'IĘ'),     meaning: 'себе (зворотна частка)', phonetic: '[шє]' },
    ],
  },
  {
    id: 'soft',
    tabLabel: 'Ć / Ś / Ź / Ń',
    ukSound: 'ЧЬ / СЬ / ЗЬ / НЬ',
    plGrapheme: 'Ć / Ś / Ź / Ń',
    note:
      'В польській є пом\'якшені приголосні: Ć=[ЧЬ], Ś=[СЬ], Ź=[ЗЬ], Ń=[НЬ]. Перед голосними пишуться CI, SI, ZI, NI — але звучать так само м\'яко.',
    extra: 'Правило пар: C → [Ц], Ć/CI → [ЧЬ]; S → [С], Ś/SI → [СЬ]; Z → [З], Ź/ZI → [ЗЬ]; N → [Н], Ń/NI → [НЬ]. Буква I тут — знак пом\'якшення!',
    examples: [
      { uk: w('НЕБО', 'НЕ'),     pl: w('NIEBO', 'NI'),      meaning: 'небо — NI=[НЬ]',    phonetic: '[НЬебо]' },
      { uk: w('ТИХО', ''),        pl: w('CICHO', 'CI'),       meaning: 'тихо — CI=[ЧЬ]',   phonetic: '[ЧЬіхо]' },
      { uk: w('ЗЕЛЕНИЙ', 'ЗЕ'),  pl: w('ZIELONY', 'ZI'),    meaning: 'зелений — ZI=[ЗЬ]', phonetic: '[ЗЬелони]' },
      { uk: w('СЕСТРА', 'СЕ'),   pl: w('SIOSTRA', 'SI'),    meaning: 'сестра — SI=[СЬ]',  phonetic: '[СЬостра]' },
      { uk: w('ОСІНЬ', 'НЬ'),    pl: w('JESIEŃ', 'Ń'),      meaning: 'осінь — Ń=[НЬ]',    phonetic: '[єшєНЬ]' },
      { uk: w('СЬОГОДНІ', 'С'), pl: w('DZIŚ', 'Ś'),          meaning: 'сьогодні — Ś=[СЬ]',phonetic: '[джіСЬ]' },
      { uk: w('МАТИ', ''),        pl: w('MIEĆ', 'Ć'),         meaning: 'мати — Ć=[ЧЬ]',    phonetic: '[мєЧЬ]' },
      { uk: w('СИНІЙ', ''),       pl: w('NIEBIESKI', 'NI'),   meaning: 'синій — NI=[НЬ]',  phonetic: '[НЬебєскі]' },
    ],
  },
];

/* ─── Cognate note (applies globally) ──────────────── */

const COGNATE_NOTE = {
  title: '"В укр. мові є …" — не завжди прямий переклад',
  body: 'Лайфхак працює з однокореневими або схожими словами, а не лише з точними перекладами. Достатньо знайти Ж/Ш/Ч/Щ у відповідному корені.',
  example: {
    polish:    w('straŻak', 'Ż'),
    polishMeaning: 'straŻak = пожежник',
    cognate:   w('СТРАЖ', 'Ж'),
    cognateNote: 'СТРАЖ (охорона, варта) — не прямий переклад, але той самий корінь!',
    chain: 'СТРАЖ → Ж → Ż → straŻak ✓',
  },
};

/* ─── Accent config (static Tailwind strings) ───────── */

type Accent = {
  text: string; bg: string; border: string; mark: string;
  tabIdle: string; tabActive: string; dot: string;
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
  l: {
    text:      'text-[#7c3aed]',
    bg:        'bg-[#f5f3ff]',
    border:    'border-[#c4b5fd]',
    mark:      'bg-[#ddd6fe] text-[#4c1d95]',
    tabIdle:   'border-[#c4b5fd] text-[#7c3aed] hover:bg-[#f5f3ff]',
    tabActive: 'bg-[#7c3aed] text-white border-[#7c3aed]',
    dot:       'bg-[#7c3aed]',
  },
  an: {
    text:      'text-[#be185d]',
    bg:        'bg-[#fdf2f8]',
    border:    'border-[#f9a8d4]',
    mark:      'bg-[#fbcfe8] text-[#831843]',
    tabIdle:   'border-[#f9a8d4] text-[#be185d] hover:bg-[#fdf2f8]',
    tabActive: 'bg-[#be185d] text-white border-[#be185d]',
    dot:       'bg-[#be185d]',
  },
  soft: {
    text:      'text-[#4338ca]',
    bg:        'bg-[#eef2ff]',
    border:    'border-[#a5b4fc]',
    mark:      'bg-[#c7d2fe] text-[#312e81]',
    tabIdle:   'border-[#a5b4fc] text-[#4338ca] hover:bg-[#eef2ff]',
    tabActive: 'bg-[#4338ca] text-white border-[#4338ca]',
    dot:       'bg-[#4338ca]',
  },
};

/* ─── Helpers ────────────────────────────────────────── */

function WordDisplay({
  word, markClass, active,
}: { word: ExampleWord; markClass: string; active: boolean }) {
  return (
    <span className="font-mono text-base sm:text-lg font-bold tracking-widest">
      {word.segments.map((seg, i) =>
        seg.hl && active
          ? <mark key={i} className={`${markClass} px-0.5 rounded not-italic`}>{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </span>
  );
}

function ExampleRow({
  ex, markClass, exceptionMark, isException = false, isActive, onToggle,
}: {
  ex: Example;
  markClass: string;
  exceptionMark?: string;
  isException?: boolean;
  isActive: boolean;
  onToggle: () => void;
}) {
  const mark = isException && exceptionMark ? exceptionMark : markClass;
  const activeBorder = isException
    ? 'border-terracotta/50 bg-terracotta/15 scale-[1.01]'
    : `border-ink/30 shadow-sm scale-[1.01]`;
  const idleBorder = isException
    ? 'border-terracotta/20 bg-terracotta/5 hover:border-terracotta/35'
    : 'border-ink/10 bg-paper/40 hover:border-ink/20 hover:bg-paper/60';

  return (
    <div
      onMouseEnter={onToggle}
      onMouseLeave={onToggle}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border cursor-pointer select-none px-4 py-3 transition-all duration-200 ${
        isActive ? activeBorder : idleBorder
      }`}
    >
      <WordDisplay word={ex.uk} markClass={mark} active={isActive} />
      <span className={`text-lg transition-colors ${isActive ? (isException ? 'text-terracotta' : 'text-ink/60') : 'text-ink/25'}`}>→</span>
      <WordDisplay word={ex.pl} markClass={mark} active={isActive} />
      {ex.phonetic && (
        <span className={`text-sm font-mono transition-colors ${isActive ? (isException ? 'text-terracotta font-bold' : 'text-ink/70 font-bold') : 'text-ink/30'}`}>
          {ex.phonetic}
        </span>
      )}
      {ex.meaning && (
        <span className="ml-auto text-xs text-ink/40 italic shrink-0">{ex.meaning}</span>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */

export function PhonemeLifehackSection() {
  const [activeId, setActiveId]       = useState('y');
  const [hoveredEx, setHoveredEx]     = useState<number | null>(null);
  const [hoveredExc, setHoveredExc]   = useState<number | null>(null);
  const [hoveredPfx, setHoveredPfx]   = useState<number | null>(null);
  const [showCognate, setShowCognate] = useState(false);

  const rule = RULES.find(r => r.id === activeId)!;
  const ac   = ACCENT[activeId];

  function selectRule(id: string) {
    setActiveId(id);
    setHoveredEx(null);
    setHoveredExc(null);
    setHoveredPfx(null);
  }

  function toggleEx(i: number) {
    setHoveredEx(prev => prev === i ? null : i);
  }
  function toggleExc(i: number) {
    setHoveredExc(prev => prev === i ? null : i);
  }
  function togglePfx(i: number) {
    setHoveredPfx(prev => prev === i ? null : i);
  }

  return (
    <article className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft">

      {/* ── Header + lifehack disclaimer ── */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${ac.border} ${ac.bg} text-lg transition-colors duration-300`}>
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

      {/* Disclaimer badge */}
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-[#b45309]">
        <span>💡</span>
        <span>Це лайфхаки, а не суворі правила — допомагають вгадати написання, але є винятки</span>
      </div>

      {/* ── Rule tabs ── */}
      <div className="flex flex-wrap gap-2 mb-5" role="tablist">
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
      <div className={`rounded-2xl border ${ac.border} ${ac.bg} p-5 mb-5 transition-all duration-300`}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <div className={`rounded-xl border-2 ${ac.border} bg-paper/90 px-4 py-2 text-center min-w-[80px]`}>
            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-0.5">Укр. звук</p>
            <p className={`text-2xl font-black font-mono ${ac.text} leading-none`}>{rule.ukSound}</p>
          </div>
          <span className={`text-xl font-bold ${ac.text} opacity-60`}>→</span>
          <div className={`rounded-xl border-2 ${ac.border} bg-paper/90 px-4 py-2 text-center min-w-[80px]`}>
            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-0.5">Пол. буква</p>
            <p className={`text-2xl font-black font-mono ${ac.text} leading-none`}>{rule.plGrapheme}</p>
          </div>
          <div className={`hidden sm:block ml-2 h-[2px] flex-1 max-w-[60px] rounded-full opacity-30 ${ac.dot}`} />
        </div>
        <p className="text-sm text-ink/70 leading-relaxed">{rule.note}</p>
        {rule.extra && (
          <p className={`text-sm font-semibold ${ac.text} mt-2`}>{rule.extra}</p>
        )}
      </div>

      {/* ── Examples ── */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35 mb-2 font-semibold">
          Приклади — натисни або наведи для підсвічування
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rule.examples.map((ex, i) => (
            <ExampleRow
              key={i}
              ex={ex}
              markClass={ac.mark}
              isActive={hoveredEx === i}
              onToggle={() => toggleEx(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Exception block (RZ rule only) ── */}
      {rule.exception && (
        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-5 space-y-4">

          {/* Exception header */}
          <div>
            <p className="text-xs font-black text-terracotta uppercase tracking-wider mb-1">
              ⚠️ NB! Виняток
            </p>
            <p className="text-sm text-ink/75">
              <span className="font-semibold">{rule.exception.condition}</span>
              {' → читається як '}
              <span className="font-black text-terracotta text-base">{rule.exception.result}</span>
            </p>
          </div>

          {/* Voiceless consonants list */}
          {rule.exception.voicelessChars && (
            <div className="rounded-xl border border-terracotta/20 bg-paper/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-2 font-semibold">
                Глухі приголосні (перед RZ → дає [Ш])
              </p>
              <div className="flex flex-wrap gap-2">
                {rule.exception.voicelessChars.map(ch => (
                  <span
                    key={ch}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-terracotta/30 bg-terracotta/10 font-mono text-sm font-black text-terracotta"
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-ink/40 mt-2">
                (у пол. транскрипції: p, t, k, s, f, ch, c, cz, sz)
              </p>
            </div>
          )}

          {/* Prefix mnemonic (PRZY-/PRZE-) */}
          {rule.exception.prefixNote && (
            <div className="rounded-xl border border-terracotta/25 bg-terracotta/5 px-4 py-3">
              <p className="text-xs font-bold text-terracotta mb-2">
                🧠 {rule.exception.prefixNote.title}
              </p>
              <div className="space-y-2 mb-3">
                {rule.exception.prefixNote.examples.map((ex, i) => (
                  <ExampleRow
                    key={i}
                    ex={ex}
                    markClass="bg-terracotta/30 text-terracotta"
                    exceptionMark="bg-terracotta/30 text-terracotta"
                    isException
                    isActive={hoveredPfx === i}
                    onToggle={() => togglePfx(i)}
                  />
                ))}
              </div>
              <p className="text-xs text-ink/55 leading-relaxed italic border-t border-terracotta/15 pt-2">
                {rule.exception.prefixNote.popNote}
              </p>
            </div>
          )}

          {/* Exception examples */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35 mb-2 font-semibold">
              Ще приклади з глухими + RZ
            </p>
            <div className="space-y-2">
              {rule.exception.examples.map((ex, i) => (
                <ExampleRow
                  key={i}
                  ex={ex}
                  markClass="bg-terracotta/30 text-terracotta"
                  exceptionMark="bg-terracotta/30 text-terracotta"
                  isException
                  isActive={hoveredExc === i}
                  onToggle={() => toggleExc(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cognate note ── */}
      <div className="mt-5 rounded-2xl border border-moss/30 bg-moss/5 p-5">
        <button
          onClick={() => setShowCognate(v => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🌿</span>
            <p className="text-sm font-bold text-moss">{COGNATE_NOTE.title}</p>
          </div>
          <span className={`text-moss transition-transform duration-200 ${showCognate ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showCognate && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-ink/70 leading-relaxed">{COGNATE_NOTE.body}</p>
            <div className="rounded-xl border border-moss/25 bg-paper/60 px-4 py-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-ink/40 font-semibold">Приклад</p>
              {/* Chain display */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <WordDisplay
                  word={COGNATE_NOTE.example.cognate}
                  markClass="bg-moss/30 text-moss"
                  active
                />
                <span className="text-ink/40">→ Ж = Ż →</span>
                <WordDisplay
                  word={COGNATE_NOTE.example.polish}
                  markClass="bg-moss/30 text-moss"
                  active
                />
                <span className="text-xs text-ink/45 italic ml-1">({COGNATE_NOTE.example.polishMeaning})</span>
              </div>
              <p className="text-xs text-ink/55 italic">{COGNATE_NOTE.example.cognateNote}</p>
              <div className="rounded-lg bg-moss/15 px-3 py-1.5 text-xs font-mono font-bold text-moss">
                {COGNATE_NOTE.example.chain}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
