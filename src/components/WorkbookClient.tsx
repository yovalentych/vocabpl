"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import {
  ArrowRight,
  PaperPlaneRight,
  Sparkle,
  PencilLine,
  ChatCircleText,
  ArrowsLeftRight,
  Sparkle as StoryIcon,
  PuzzlePiece,
  ShuffleSimple,
  Translate,
  Play,
  CheckCircle,
  WarningCircle,
  XCircle,
  Info
} from "@phosphor-icons/react";
import type { Word } from "@/lib/types";
import { validateGeneratedContent } from "@/lib/difficulty";

type WorkbookWord = Word & { sentences: string[] };

type Entry = {
  id: string;
  number: number;
  createdAt: string;
  items: { pl: string; uk: string; text: string; sentenceCount: number; points: number }[];
  totalPoints: number;
  formattedText: string;
};
type Submission = {
  id: string;
  entryId: string;
  status: "pending" | "reviewed";
  comment?: string;
};

function countSentences(sentences: string[]) {
  return sentences.map((item) => item.trim()).filter(Boolean).length;
}

function scoreForCount(count: number) {
  if (count >= 3) return 1;
  if (count === 2) return 0.75;
  if (count === 1) return 0.5;
  return 0;
}

export default function WorkbookClient() {
  const { t, locale } = useLocale();
  const { isActive } = useAuthStatus();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "verbs",
    "adverbs",
    "adjectives",
    "slang",
    "others",
    "soft_swears",
    "clean_emotions",
    "abbreviations"
  ]);
  const [includeFavorites, setIncludeFavorites] = useState(true);
  const [includeMyWords, setIncludeMyWords] = useState(true);
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<WorkbookWord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [activeExercise, setActiveExercise] = useState<
    "sentences" | "dialogue" | "story" | "cloze" | "match" | "translate" | "paraphrase"
  >("sentences");
  const [activeTab, setActiveTab] = useState<"setup" | "practice" | "history">("practice");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState<null | typeof activeExercise>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitStatus, setSubmitStatus] = useState<Record<string, "idle" | "saving" | "done" | "error">>({});
  const [taskOpen, setTaskOpen] = useState(false);
  const [dialogueMap, setDialogueMap] = useState<Record<string, string[]>>({});
  const [contentItems, setContentItems] = useState<{ _id: string; title?: string; prompt: string }[]>([]);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<Record<string, boolean>>({});
  const [aiTopics, setAiTopics] = useState<Record<string, string>>({});
  const [aiPrompts, setAiPrompts] = useState<Record<string, { title?: string; prompt: string } | null>>({});
  const [aiStatus, setAiStatus] = useState<Record<string, "idle" | "loading" | "error">>({});
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [clozeMaterials, setClozeMaterials] = useState<any[]>([]);
  const [activeClozeId, setActiveClozeId] = useState<string | null>(null);
  const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({});
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeScore, setClozeScore] = useState<number | null>(null);
  const [clozePoints, setClozePoints] = useState<number | null>(null);
  const [clozeFocusId, setClozeFocusId] = useState<string | null>(null);
  const [clozeHintsOpen, setClozeHintsOpen] = useState<Record<string, boolean>>({});
  const [clozeHintsDefault, setClozeHintsDefault] = useState(true);
  const [clozeFocusOnStart, setClozeFocusOnStart] = useState(false);
  const [clozeAwarded, setClozeAwarded] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialRandom, setMaterialRandom] = useState(false);
  const [materialCount, setMaterialCount] = useState(5);
  const [materialInfinite, setMaterialInfinite] = useState(false);
  const [seenMaterials, setSeenMaterials] = useState<Record<string, string[]>>({});
  const [clozeQueue, setClozeQueue] = useState<string[]>([]);
  const [clozeQueueIndex, setClozeQueueIndex] = useState(0);
  const [clozeTrainingActive, setClozeTrainingActive] = useState(false);
  const [matchMaterials, setMatchMaterials] = useState<any[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matchLeft, setMatchLeft] = useState<string[]>([]);
  const [matchRight, setMatchRight] = useState<string[]>([]);
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);
  const [matchMatched, setMatchMatched] = useState<Record<string, string>>({});
  const [matchAwarded, setMatchAwarded] = useState(false);
  const [matchPoints, setMatchPoints] = useState<number | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchQueue, setMatchQueue] = useState<string[]>([]);
  const [matchQueueIndex, setMatchQueueIndex] = useState(0);
  const [matchTrainingActive, setMatchTrainingActive] = useState(false);
  const [matchAutoEnabled, setMatchAutoEnabled] = useState(false);
  const [matchAutoLoading, setMatchAutoLoading] = useState(false);
  const [matchAutoMaterial, setMatchAutoMaterial] = useState<any | null>(null);
  const [matchFocusOpen, setMatchFocusOpen] = useState(false);
  const [matchAutoTypes, setMatchAutoTypes] = useState<string[]>(["verbs", "adverbs", "adjectives"]);
  const [matchAutoLastUsed, setMatchAutoLastUsed] = useState<string | null>(null);
  const [matchResultOpen, setMatchResultOpen] = useState(false);
  const [matchAutoPreferred, setMatchAutoPreferred] = useState(false);
  const [matchFocusOnStart, setMatchFocusOnStart] = useState(false);
  const [translateDirection, setTranslateDirection] = useState<"uk_to_pl" | "pl_to_uk">("uk_to_pl");
  const [translateCount, setTranslateCount] = useState(6);
  const [translatePrompt, setTranslatePrompt] = useState("");
  const [translateUseVocab, setTranslateUseVocab] = useState(true);
  const [translateTask, setTranslateTask] = useState<{
    id: string;
    level: string;
    direction: "uk_to_pl" | "pl_to_uk";
    topic: string;
    items: { id: string; source: string; hints?: string | null; targetVocab?: string[] }[];
  } | null>(null);
  const [translateAnswers, setTranslateAnswers] = useState<Record<string, string>>({});
  const [translateResult, setTranslateResult] = useState<any | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateVocabStatus, setTranslateVocabStatus] = useState<Record<string, "idle" | "saving" | "done" | "error">>({});
  const [translateBulkLoading, setTranslateBulkLoading] = useState(false);
  const [dialogPack, setDialogPack] = useState<any | null>(null);
  const [dialogActiveId, setDialogActiveId] = useState<string | null>(null);
  const [dialogRoleplay, setDialogRoleplay] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [dialogInput, setDialogInput] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogFeedback, setDialogFeedback] = useState<any | null>(null);
  const [dialogSuggestedStatus, setDialogSuggestedStatus] = useState<Record<string, "idle" | "saving" | "done" | "error">>({});
  const [dialogMode, setDialogMode] = useState<"ai" | "static">("ai");
  const [dialogStartBy, setDialogStartBy] = useState<"user" | "ai">("ai");
  const [dialogStaticDialogs, setDialogStaticDialogs] = useState<any[]>([]);
  const [paraphraseMaterials, setParaphraseMaterials] = useState<any[]>([]);
  const [activeParaphraseId, setActiveParaphraseId] = useState<string | null>(null);
  const [paraphraseMode, setParaphraseMode] = useState<"ai" | "static">("ai");
  const [paraphraseTopic, setParaphraseTopic] = useState("");
  const [paraphraseGenerateCount, setParaphraseGenerateCount] = useState(5);
  const [paraphraseTask, setParaphraseTask] = useState<any | null>(null);
  const [paraphraseAnswers, setParaphraseAnswers] = useState<Record<string, string>>({});
  const [paraphraseResult, setParaphraseResult] = useState<any | null>(null);
  const [paraphraseLoading, setParaphraseLoading] = useState(false);
  const [paraphraseSuggestedStatus, setParaphraseSuggestedStatus] = useState<
    Record<string, "idle" | "saving" | "done" | "error">
  >({});
  const [paraphraseWarning, setParaphraseWarning] = useState<string | null>(null);
  const [paraphraseFocusOpen, setParaphraseFocusOpen] = useState(false);
  const [paraphraseFocusIndex, setParaphraseFocusIndex] = useState(0);
  const [paraphraseAwardedPoints, setParaphraseAwardedPoints] = useState<number | null>(null);

  const typeOptions = useMemo(
    () => [
      { id: "verbs", label: t.deck.verbs },
      { id: "adverbs", label: t.deck.adverbs },
      { id: "adjectives", label: t.deck.adjectives },
      { id: "slang", label: t.deck.slang },
      { id: "others", label: t.deck.others },
      { id: "soft_swears", label: t.deck.softSwears },
      { id: "clean_emotions", label: t.deck.cleanEmotions },
      { id: "abbreviations", label: t.deck.abbreviations }
    ],
    [t]
  );

  const exerciseTypes = useMemo(
    () => [
      {
        id: "sentences" as const,
        title: t.workbook.exercises.sentences.title,
        description: t.workbook.exercises.sentences.description,
        status: "active",
        icon: PencilLine
      },
      {
        id: "dialogue" as const,
        title: t.workbook.exercises.dialogue.title,
        description: t.workbook.exercises.dialogue.description,
        status: "active",
        icon: ChatCircleText
      },
      {
        id: "paraphrase" as const,
        title: t.workbook.exercises.rewrite.title,
        description: t.workbook.exercises.rewrite.description,
        status: "active",
        icon: ArrowsLeftRight
      },
      {
        id: "story" as const,
        title: t.workbook.exercises.story.title,
        description: t.workbook.exercises.story.description,
        status: "active",
        icon: StoryIcon
      },
      {
        id: "cloze" as const,
        title: t.workbook.exercises.cloze.title,
        description: t.workbook.exercises.cloze.description,
        status: "active",
        icon: PuzzlePiece
      },
      {
        id: "match" as const,
        title: t.workbook.exercises.match.title,
        description: t.workbook.exercises.match.description,
        status: "active",
        icon: ShuffleSimple
      },
      {
        id: "translate" as const,
        title: t.workbook.exercises.translate.title,
        description: t.workbook.exercises.translate.description,
        status: "active",
        icon: Translate
      }
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    async function loadEntries() {
      const res = await fetch("/api/workbook/entries");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setEntries(data.entries || []);
    }
    async function loadSubmissions() {
      const res = await fetch("/api/workbook/submissions");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setSubmissions(data.submissions || []);
    }
    loadEntries();
    loadSubmissions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("match_auto_last_used");
    if (stored) setMatchAutoLastUsed(stored);
  }, []);

  async function generateWords() {
    setLoading(true);
    setSaveStatus("idle");
    const selected = [...selectedTypes];
    if (includeFavorites) selected.push("favorites");
    if (includeMyWords) selected.push("my_words");
    const params = new URLSearchParams();
    params.set("types", selected.join(","));
    params.set("count", String(count));
    const res = await fetch(`/api/workbook/words?${params.toString()}`);
    const data = await res.json();
    setLocked(Boolean(data.locked));
    const nextItems = (data.items || []).map((word: Word) => ({ ...word, sentences: ["", "", ""] }));
    setItems(nextItems);
    setActiveId(nextItems[0]?.id || null);
    setLoading(false);
    setTaskOpen(true);
  }

  function updateSentence(id: string, index: number, value: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              sentences: item.sentences.map((sentence, idx) => (idx === index ? value : sentence))
            }
          : item
      )
    );
  }

  async function saveEntry() {
    const payload = items.map((item) => ({
      wordId: item.id,
      pl: item.pl,
      uk: item.uk,
      type: item.type,
      text: item.sentences.map((sentence) => sentence.trim()).filter(Boolean).join("\n")
    }));
    if (!payload.some((item) => item.text.trim())) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    const res = await fetch("/api/workbook/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) {
      setSaveStatus("error");
      return;
    }
    const data = await res.json();
    setSaveStatus("done");
    setEntries((prev) => [data.entry, ...prev]);
  }

  async function submitForReview(entry: Entry) {
    setSubmitStatus((prev) => ({ ...prev, [entry.id]: "saving" }));
    const res = await fetch("/api/workbook/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: entry.id })
    });
    if (!res.ok) {
      setSubmitStatus((prev) => ({ ...prev, [entry.id]: "error" }));
      return;
    }
    const data = await res.json();
    setSubmissions((prev) => [data.submission, ...prev]);
    setSubmitStatus((prev) => ({ ...prev, [entry.id]: "done" }));
  }

  const totalPoints = items.reduce((sum, item) => sum + scoreForCount(countSentences(item.sentences)), 0);
  const activeWord = items.find((item) => item.id === activeId) || items[0];
  const activeIndex = items.findIndex((item) => item.id === activeWord?.id);
  const activeContent = contentItems.find((item) => item._id === activeContentId) || contentItems[0];
  const isAiActive = Boolean(aiEnabled[activeExercise]);
  const aiContent = aiPrompts[activeExercise] || null;
  const activeCloze = clozeMaterials.find((item) => item._id === activeClozeId);
  const activeMatch =
    activeMatchId === "__auto__"
      ? matchAutoMaterial
      : matchMaterials.find((item) => item._id === activeMatchId);

  const normalizeAnswer = useCallback((value: string) => value.trim().toLowerCase(), []);

  const isGapCorrect = useCallback(
    (gap: any, value: string) => {
      if (!gap || !Array.isArray(gap.answers)) return false;
      const normalized = normalizeAnswer(value);
      return gap.answers.some((ans: string) => normalizeAnswer(ans) === normalized);
    },
    [normalizeAnswer]
  );

  const computeClozeScore = useCallback(
    (material: any, answers: Record<string, string>) => {
      if (!material) return { total: 0, correct: 0, score: 0 };
      const items = material.content?.items || [];
      let total = 0;
      let correct = 0;
      items.forEach((item: any, idx: number) => {
        (item.gaps || []).forEach((gap: any, gapIdx: number) => {
          total += 1;
          const key = `${item.id || idx}-${gapIdx}`;
          const answer = answers[key] || "";
          if (isGapCorrect(gap, answer)) correct += 1;
        });
      });
      const score = total === 0 ? 0 : correct / total;
      return { total, correct, score };
    },
    [isGapCorrect]
  );

  const shuffle = useCallback(<T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  const initMatch = useCallback(
    (material: any) => {
      if (!material) return;
      const pairs = material.content?.pairs || [];
      const left = pairs.map((pair: any) => String(pair.left));
      const right = pairs.map((pair: any) => String(pair.right));
      const shouldShuffle = material.content?.shuffle !== false;
      setMatchLeft(shouldShuffle ? shuffle(left) : left);
      setMatchRight(shouldShuffle ? shuffle(right) : right);
      setMatchMatched({});
      setMatchSelectedLeft(null);
      setMatchAwarded(false);
      setMatchPoints(null);
      setMatchScore(null);
    },
    [shuffle]
  );

  async function loadMatchAuto() {
    setMatchAutoLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("count", String(Math.min(materialCount, 20)));
      if (matchAutoTypes.length > 0) {
        params.set("types", matchAutoTypes.join(","));
      }
      const res = await fetch(`/api/words/random?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data.items) ? data.items : [];
      const pairs = items
        .filter((item: any) => item?.pl && item?.uk)
        .map((item: any) => ({ left: String(item.pl), right: String(item.uk) }));
      if (pairs.length === 0) {
        setMatchAutoEnabled(false);
        setMatchAutoMaterial(null);
        return;
      }
      const now = new Date().toISOString();
      setMatchAutoLastUsed(now);
      localStorage.setItem("match_auto_last_used", now);
      const material = {
        _id: "__auto__",
        title: t.workbook.matchAutoTitle,
        level: "A1",
        content: { pairs, shuffle: true, source: "dictionary" }
      };
      setMatchAutoMaterial(material);
      setMatchAutoEnabled(true);
      setActiveMatchId("__auto__");
      initMatch(material);
      if (matchFocusOnStart) {
        setMatchFocusOpen(true);
      }
      setMatchTrainingActive(false);
      setMatchQueue([]);
      setMatchQueueIndex(0);
      setMatchAwarded(false);
      setMatchPoints(null);
    } finally {
      setMatchAutoLoading(false);
    }
  }

  useEffect(() => {
    if (activeExercise !== "dialogue" || !activeWord?.id) return;
    setDialogueMap((prev) =>
      prev[activeWord.id] ? prev : { ...prev, [activeWord.id]: ["", "", "", ""] }
    );
  }, [activeExercise, activeWord?.id]);

  useEffect(() => {
    if (activeExercise !== "dialogue") return;
    let mounted = true;
    async function loadDialogStatic() {
      const res = await fetch(`/api/exercises?type=dialogue&level=A1`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setDialogStaticDialogs(Array.isArray(data.items) ? data.items : []);
    }
    loadDialogStatic();
    return () => {
      mounted = false;
    };
  }, [activeExercise]);

  useEffect(() => {
    if (activeExercise !== "paraphrase") return;
    let mounted = true;
    async function loadParaphrase() {
      const res = await fetch(`/api/exercises?type=paraphrase&level=A1`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      const items = Array.isArray(data.items) ? data.items : [];
      setParaphraseMaterials(items);
      if (!activeParaphraseId && items[0]?._id) {
        setActiveParaphraseId(items[0]._id);
      }
    }
    loadParaphrase();
    return () => {
      mounted = false;
    };
  }, [activeExercise, activeParaphraseId]);

  useEffect(() => {
    let mounted = true;
    async function loadContent() {
      if (isAiActive) {
        setContentItems([]);
        setActiveContentId(null);
        return;
      }
      const res = await fetch(`/api/workbook/content?type=${activeExercise}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      const items = data.items || [];
      setContentItems(items);
      setActiveContentId(items[0]?._id || null);
    }
    loadContent();
    return () => {
      mounted = false;
    };
  }, [activeExercise, isAiActive]);

  useEffect(() => {
    if (activeExercise !== "cloze") return;
    let mounted = true;
    async function loadCloze() {
      const res = await fetch(`/api/exercises?type=cloze&level=A1`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      const materials = data.items || [];
      setClozeMaterials(materials);
      setActiveClozeId(materials[0]?._id || null);
      setClozeAnswers({});
      setClozeChecked(false);
      setClozeScore(null);
      setClozePoints(null);
      setClozeAwarded(false);
      setClozeQueue([]);
      setClozeQueueIndex(0);
      setClozeTrainingActive(false);
    }
    loadCloze();
    return () => {
      mounted = false;
    };
  }, [activeExercise]);

  useEffect(() => {
    if (activeExercise !== "match") return;
    let mounted = true;
    async function loadMatch() {
      const res = await fetch(`/api/exercises?type=match&level=A1`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      const materials = data.items || [];
      setMatchMaterials(materials);
      setActiveMatchId(materials[0]?._id || null);
      setMatchQueue([]);
      setMatchQueueIndex(0);
      setMatchTrainingActive(false);
    }
    loadMatch();
    return () => {
      mounted = false;
    };
  }, [activeExercise]);

  useEffect(() => {
    if (activeExercise !== "match") return;
    initMatch(activeMatch);
  }, [activeExercise, activeMatchId, activeMatch, initMatch]);

  useEffect(() => {
    if (activeExercise !== "cloze") return;
    if (!activeCloze) return;
    const result = computeClozeScore(activeCloze, clozeAnswers);
    setClozeChecked(Object.keys(clozeAnswers).length > 0);
    setClozeScore(result.score);
    setClozeAwarded(false);
    setClozePoints(null);
  }, [activeExercise, activeCloze, clozeAnswers, computeClozeScore]);

  useEffect(() => {
    if (!activeClozeId || !clozeAwarded) return;
    setSeenMaterials((prev) => {
      const key = "cloze";
      const list = prev[key] || [];
      if (list.includes(activeClozeId)) return prev;
      const next = { ...prev, [key]: [...list, activeClozeId] };
      window.localStorage.setItem("exercise_seen", JSON.stringify(next));
      return next;
    });
  }, [activeClozeId, clozeAwarded]);

  useEffect(() => {
    if (!activeMatchId || !matchAwarded) return;
    setSeenMaterials((prev) => {
      const key = "match";
      const list = prev[key] || [];
      if (list.includes(activeMatchId)) return prev;
      const next = { ...prev, [key]: [...list, activeMatchId] };
      window.localStorage.setItem("exercise_seen", JSON.stringify(next));
      return next;
    });
  }, [activeMatchId, matchAwarded]);

  useEffect(() => {
    const stored = window.localStorage.getItem("exercise_seen");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") setSeenMaterials(parsed);
    } catch {
      // ignore
    }
  }, []);

  async function generateAiPrompt(exercise: typeof activeExercise) {
    const provider = "pvs";
    setAiMessage(null);
    setAiStatus((prev) => ({ ...prev, [exercise]: "loading" }));
    const topic = aiTopics[exercise] || "";
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: exercise === "dialogue" ? "workbook_dialogue_prompt" : "workbook_sentence_prompt",
        userInput: topic,
        context: "",
        provider
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiStatus((prev) => ({ ...prev, [exercise]: "error" }));
      const errorCode = data?.code;
      const message =
        errorCode === "ai_quota"
          ? t.workbook.aiQuotaExceeded
          : errorCode === "pvs_unavailable"
          ? t.workbook.aiPlanRequired
          : data?.error || t.workbook.aiError;
      setAiMessage(message);
      const statusPayload = JSON.stringify({ status: "error", at: new Date().toISOString() });
      window.localStorage.setItem("byok_last_status", statusPayload);
      window.dispatchEvent(new Event("byok-status"));
      return;
    }
    const text = String(data?.text || "");
    let nextPrompt: { title?: string; prompt: string } | null = null;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.prompt) {
        nextPrompt = { title: parsed?.title, prompt: String(parsed.prompt) };
      }
    } catch (error) {
      nextPrompt = { prompt: text };
    }
    if (nextPrompt) {
      setAiPrompts((prev) => ({ ...prev, [exercise]: nextPrompt }));
    }
    setAiStatus((prev) => ({ ...prev, [exercise]: "idle" }));
    const event = new Event("byok-used");
    window.dispatchEvent(event);
    window.localStorage.setItem("byok_last_used", new Date().toISOString());
    const statusPayload = JSON.stringify({ status: "ok", at: new Date().toISOString() });
    window.localStorage.setItem("byok_last_status", statusPayload);
    window.dispatchEvent(new Event("byok-status"));
  }

  async function generateTranslateTask() {
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    setTranslateLoading(true);
    setAiMessage(null);
    let vocabPool: { id: string; lemma: string }[] = [];
    if (translateUseVocab) {
      const res = await fetch(`/api/words/random?count=20`);
      const data = await res.json().catch(() => ({}));
      vocabPool = Array.isArray(data.items)
        ? data.items.map((item: any) => ({ id: String(item.id || item._id || item.pl), lemma: String(item.pl) }))
        : [];
    }
    const payload = {
      exerciseType: "translate_sentences",
      action: "generate",
      level: "A1",
      direction: translateDirection,
      prompt: translatePrompt,
      count: Math.max(3, Math.min(20, translateCount)),
      vocabPool
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "translate_generate",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorCode = data?.code;
      const message =
        errorCode === "ai_quota"
          ? t.workbook.aiQuotaExceeded
          : errorCode === "pvs_unavailable"
            ? t.workbook.aiPlanRequired
            : data?.error || t.workbook.aiError;
      setAiMessage(message);
      setTranslateLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      if (parsed?.task) {
        setTranslateTask(parsed.task);
        setTranslateAnswers({});
        setTranslateResult(null);
      } else {
        setAiMessage(t.workbook.aiError);
      }
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setTranslateLoading(false);
  }

  async function checkTranslateTask() {
    if (!translateTask) return;
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    setTranslateLoading(true);
    const items = translateTask.items.map((item) => ({
      id: item.id,
      source: item.source,
      user: translateAnswers[item.id] || ""
    }));
    const payload = {
      exerciseType: "translate_sentences",
      action: "check",
      taskId: translateTask.id,
      level: translateTask.level,
      direction: translateTask.direction,
      items
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "translate_check",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorCode = data?.code;
      const message =
        errorCode === "ai_quota"
          ? t.workbook.aiQuotaExceeded
          : errorCode === "pvs_unavailable"
            ? t.workbook.aiPlanRequired
            : data?.error || t.workbook.aiError;
      setAiMessage(message);
      setTranslateLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      setTranslateResult(parsed);
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setTranslateLoading(false);
  }

  async function addSuggestedVocab(lemma: string, meaning: string) {
    const key = `${lemma}|||${meaning}`;
    setTranslateVocabStatus((prev) => ({ ...prev, [key]: "saving" }));
    const res = await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl: lemma, uk: meaning || "-" })
    });
    if (res.ok) {
      setTranslateVocabStatus((prev) => ({ ...prev, [key]: "done" }));
    } else {
      setTranslateVocabStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  async function addAllSuggestedVocab() {
    if (!translateResult || !Array.isArray(translateResult.suggestedVocab)) return;
    setTranslateBulkLoading(true);
    for (const item of translateResult.suggestedVocab) {
      const lemma = item.lemma;
      const meaning = item.meaning || item.meaningUk || "-";
      const key = `${lemma}|||${meaning}`;
      if (translateVocabStatus[key] === "done") continue;
      // eslint-disable-next-line no-await-in-loop
      await addSuggestedVocab(lemma, meaning);
    }
    setTranslateBulkLoading(false);
  }

  async function generateDialogPack() {
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    setDialogLoading(true);
    const vocabPool: { id: string; lemma: string }[] = [];
    const payload = {
      exerciseType: "mini_dialog",
      action: "generate_pack",
      level: "A1",
      topicPrompt: aiTopics.dialogue || "",
      direction: "pl_only",
      count: 3,
      constraints: { turnsMin: 6, turnsMax: 10, maxWordsPerTurn: 12 },
      vocabPool,
      startBy: dialogStartBy
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mini_dialog_generate",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorCode = data?.code;
      const message =
        errorCode === "ai_quota"
          ? t.workbook.aiQuotaExceeded
          : errorCode === "pvs_unavailable"
            ? t.workbook.aiPlanRequired
            : data?.error || t.workbook.aiError;
      setAiMessage(message);
      setDialogLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));

      // Validate content quality
      const validation = validateGeneratedContent({
        content: parsed,
        level: "A1" as any,
        exerciseType: "dialogue"
      });

      // Log validation results
      console.log("📊 Dialogue content validation:", {
        valid: validation.valid,
        score: validation.score,
        metrics: validation.metrics
      });

      if (validation.errors.length > 0) {
        console.warn("⚠️ Content quality issues:", validation.errors);
      }

      // If quality is too low, reject and retry
      if (!validation.valid || validation.score < 0.6) {
        console.error("❌ Dialogue quality too low, rejecting...");

        // Log to backend for monitoring
        fetch("/api/admin/content-quality-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "mini_dialog_generate",
            level: "A1",
            topic: aiTopics.dialogue,
            validation: {
              valid: validation.valid,
              score: validation.score,
              errors: validation.errors.map(e => e.message)
            },
            metrics: validation.metrics
          })
        }).catch(() => null);

        setAiMessage(`Якість згенерованого діалогу недостатня (score: ${(validation.score * 100).toFixed(0)}%). Спробуйте ще раз.`);
        setDialogLoading(false);
        return;
      }

      setDialogPack(parsed);
      setDialogActiveId(parsed?.dialogs?.[0]?.id || null);
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setDialogLoading(false);
  }

  async function startRoleplay() {
    setDialogRoleplay([]);
    setDialogFeedback(null);
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    if (dialogStartBy === "user") {
      return;
    }
    setDialogLoading(true);
    const payload = {
      exerciseType: "mini_dialog",
      action: "roleplay_turn",
      sessionId: "local",
      userText: "",
      history: [],
      startBy: "ai"
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mini_dialog_roleplay",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiMessage(data?.error || t.workbook.aiError);
      setDialogLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      if (parsed?.aiText) {
        setDialogRoleplay([{ role: "ai", text: parsed.aiText }]);
      }
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setDialogLoading(false);
  }

  async function sendRoleplayTurn() {
    if (!dialogInput.trim()) return;
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    const history = [...dialogRoleplay, { role: "user" as const, text: dialogInput.trim() }];
    setDialogRoleplay(history);
    setDialogInput("");
    setDialogLoading(true);
    const payload = {
      exerciseType: "mini_dialog",
      action: "roleplay_turn",
      sessionId: "local",
      userText: history[history.length - 1].text,
      history,
      startBy: dialogStartBy
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mini_dialog_roleplay",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiMessage(data?.error || t.workbook.aiError);
      setDialogLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      if (parsed?.aiText) {
        setDialogRoleplay((prev) => [...prev, { role: "ai", text: parsed.aiText }]);
      }
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setDialogLoading(false);
  }

  async function checkDialogRoleplay() {
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    setDialogLoading(true);
    const payload = {
      exerciseType: "mini_dialog",
      action: "check",
      transcript: dialogRoleplay
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mini_dialog_check",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiMessage(data?.error || t.workbook.aiError);
      setDialogLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      setDialogFeedback(parsed);
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setDialogLoading(false);
  }

  async function generateParaphrasePack() {
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    setParaphraseLoading(true);
    const payload = {
      exerciseType: "paraphrase",
      action: "generate",
      level: "A1",
      prompt: paraphraseTopic,
      count: Math.min(Math.max(paraphraseGenerateCount, 3), 20),
      constraints: { minWords: 5 },
      vocabPool: []
    };
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "paraphrase_generate",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorCode = data?.code;
      const message =
        errorCode === "ai_quota"
          ? t.workbook.aiQuotaExceeded
          : errorCode === "pvs_unavailable"
            ? t.workbook.aiPlanRequired
            : data?.error || t.workbook.aiError;
      setAiMessage(message);
      setParaphraseLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      setParaphraseTask(parsed?.task || null);
      setParaphraseAnswers({});
      setParaphraseResult(null);
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setParaphraseLoading(false);
  }

  async function checkParaphrase() {
    if (!isActive) {
      setAiMessage(t.workbook.aiNeedsKey);
      return;
    }
    const items =
      paraphraseMode === "ai"
        ? paraphraseTask?.items || []
        : paraphraseMaterials.find((m) => m._id === activeParaphraseId)?.content?.items || [];
    if (!items.length) return;
    setParaphraseWarning(null);
    for (const item of items) {
      const userText = (paraphraseAnswers[item.id] || "").trim();
      const sourceText = String(item.sourcePl || "");
      if (!userText) {
        setParaphraseWarning(t.workbook.paraphraseWarnEmpty);
        return;
      }
      const constraints = item.constraints || {};
      if (constraints.minWords) {
        const count = userText.split(/\s+/).filter(Boolean).length;
        if (count < constraints.minWords) {
          setParaphraseWarning(
            t.workbook.paraphraseWarnMinWords.replace("{count}", String(constraints.minWords))
          );
          return;
        }
      }
      if (Array.isArray(constraints.forbiddenWords) && constraints.forbiddenWords.length > 0) {
        const lowered = userText.toLowerCase();
        const hit = constraints.forbiddenWords.find((word: string) => lowered.includes(word.toLowerCase()));
        if (hit) {
          setParaphraseWarning(
            t.workbook.paraphraseWarnForbidden.replace("{word}", String(hit))
          );
          return;
        }
      }
      const normalize = (text: string) =>
        text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .replace(/\s+/g, " ")
          .trim();
      const sourceNorm = normalize(sourceText);
      const userNorm = normalize(userText);
      if (sourceNorm && userNorm) {
        const sourceWords = new Set(sourceNorm.split(" "));
        const userWords = new Set(userNorm.split(" "));
        let overlap = 0;
        sourceWords.forEach((word) => {
          if (userWords.has(word)) overlap += 1;
        });
        const ratio = overlap / Math.max(sourceWords.size, 1);
        if (ratio > 0.85) {
          setParaphraseWarning(t.workbook.paraphraseWarnSimilar);
          return;
        }
      }
    }
    const payload = {
      exerciseType: "paraphrase",
      action: "check",
      taskId: paraphraseTask?.id || activeParaphraseId || "static",
      level: "A1",
      items: items.map((item: any) => ({
        id: item.id,
        sourcePl: item.sourcePl,
        userPl: paraphraseAnswers[item.id] || "",
        constraints: item.constraints || {}
      }))
    };
    setParaphraseLoading(true);
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "paraphrase_check",
        userInput: JSON.stringify(payload),
        context: JSON.stringify({ uiLanguage: locale })
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiMessage(data?.error || t.workbook.aiError);
      setParaphraseLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(String(data?.text || ""));
      setParaphraseResult(parsed);
      setParaphraseAwardedPoints(null);
      if (parsed?.overall?.score01 != null) {
        const materialId = paraphraseTask?.id || activeParaphraseId || "static";
        const attemptRes = await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "paraphrase",
            materialId,
            score: parsed.overall.score01,
            firstOnly: true
          })
        });
        const attemptData = await attemptRes.json().catch(() => ({}));
        if (attemptRes.ok && typeof attemptData?.points === "number") {
          setParaphraseAwardedPoints(attemptData.points);
        }
      }
    } catch {
      setAiMessage(t.workbook.aiError);
    }
    setParaphraseLoading(false);
  }

  async function addParaphraseSuggested(lemma: string, meaning: string) {
    const key = `${lemma}|||${meaning}`;
    setParaphraseSuggestedStatus((prev) => ({ ...prev, [key]: "saving" }));
    const res = await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl: lemma, uk: meaning || "-" })
    });
    setParaphraseSuggestedStatus((prev) => ({ ...prev, [key]: res.ok ? "done" : "error" }));
  }

  async function addDialogSuggested(lemma: string, meaning: string) {
    const key = `${lemma}|||${meaning}`;
    setDialogSuggestedStatus((prev) => ({ ...prev, [key]: "saving" }));
    const res = await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl: lemma, uk: meaning || "-" })
    });
    setDialogSuggestedStatus((prev) => ({ ...prev, [key]: res.ok ? "done" : "error" }));
  }

  return (
    <>
      <div className="space-y-8">
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{t.workbook.title}</h2>
              <p className="mt-2 text-sm text-ink/60">{t.workbook.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
                {t.workbook.pointsLabel}: {totalPoints.toFixed(2)}
              </span>
              {activeTab === "practice" && (
                <>
                  <button
                    onClick={saveEntry}
                    className="rounded-full bg-moss px-4 py-2 text-xs font-semibold text-paper"
                    disabled={loading || items.length === 0}
                  >
                    <span className="flex items-center gap-2">
                      <PaperPlaneRight size={16} weight="bold" />
                      {saveStatus === "saving" ? t.common.loading : t.workbook.save}
                    </span>
                  </button>
                  <button
                    onClick={generateWords}
                    className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                    disabled={loading || activeExercise !== "sentences"}
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRight size={16} />
                      {t.workbook.nextSet}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { id: "practice", label: t.workbook.tabs.practice },
              { id: "setup", label: t.workbook.tabs.setup },
              { id: "history", label: t.workbook.tabs.history }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  activeTab === tab.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "setup" && (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.chooseGroups}</p>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((option) => {
                    const active = selectedTypes.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSelectedTypes((prev) =>
                            prev.includes(option.id)
                              ? prev.filter((item) => item !== option.id)
                              : [...prev, option.id]
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setIncludeFavorites((prev) => !prev)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      includeFavorites ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                    }`}
                  >
                    {t.cabinet.tabs.favorites}
                  </button>
                  <button
                    onClick={() => setIncludeMyWords((prev) => !prev)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      includeMyWords ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                    }`}
                  >
                    {t.words.myWords}
                  </button>
                </div>
                <p className="text-xs text-ink/50">{t.workbook.recommendation}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="text-sm text-ink/70">
                  {t.workbook.wordCount}
                  <input
                    type="number"
                    value={count}
                    onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                    min={1}
                    max={50}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    onClick={generateWords}
                    className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkle size={16} weight="bold" />
                      {t.workbook.generate}
                    </span>
                  </button>
                </div>
                {locked && <p className="text-xs text-terracotta">{t.workbook.locked}</p>}
                {saveStatus === "done" && <p className="text-xs text-moss">{t.workbook.saved}</p>}
                {saveStatus === "error" && <p className="text-xs text-terracotta">{t.workbook.saveError}</p>}
              </div>
            </div>
          )}
        </div>

        {activeTab === "practice" && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div
              className={`relative rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft transition-all duration-300 ${
                leftCollapsed ? "w-20" : "w-[320px]"
              }`}
            >
              <p className={`text-xs uppercase tracking-[0.3em] text-ink/40 ${leftCollapsed ? "opacity-0" : ""}`}>
                {t.workbook.exercisesTitle}
              </p>
              <div className={`mt-4 space-y-3 ${leftCollapsed ? "opacity-100" : ""}`}>
                {exerciseTypes.map((exercise) => {
                  const Icon = exercise.icon;
                  return (
                    <div
                      key={exercise.id}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                        activeExercise === exercise.id
                          ? "border-ink bg-ink/5"
                          : "border-ink/10 bg-paper/70 hover:border-ink/30"
                      }`}
                    >
                      <button
                        onClick={() => setActiveExercise(exercise.id)}
                        className="flex items-center gap-3 text-left"
                        title={exercise.title}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-paper shadow-soft">
                          <Icon size={16} weight="bold" />
                        </span>
                        {!leftCollapsed && (
                          <div>
                            <p className="text-sm font-semibold">{exercise.title}</p>
                            <p className="mt-1 text-xs text-ink/50">{exercise.description}</p>
                          </div>
                        )}
                      </button>
                      {!leftCollapsed && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveExercise(exercise.id);
                              setTaskOpen(true);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink/60"
                            aria-label={t.workbook.startExercise}
                            title={t.workbook.startExercise}
                            disabled={exercise.status === "soon"}
                          >
                            <Play size={14} weight="fill" />
                          </button>
                          <button
                            onClick={() => setSettingsOpen(exercise.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink/60"
                            aria-label={t.workbook.settingsLabel}
                            title={t.workbook.settingsLabel}
                          >
                            ⚙
                          </button>
                        </div>
                      )}
                      {leftCollapsed && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setActiveExercise(exercise.id);
                              setTaskOpen(true);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink/60"
                            aria-label={t.workbook.startExercise}
                            title={t.workbook.startExercise}
                            disabled={exercise.status === "soon"}
                          >
                            <Play size={14} weight="fill" />
                          </button>
                          <button
                            onClick={() => setSettingsOpen(exercise.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink/60"
                            aria-label={t.workbook.settingsLabel}
                            title={t.workbook.settingsLabel}
                          >
                            ⚙
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setLeftCollapsed((prev) => !prev)}
                className="absolute -right-3 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-soft"
                aria-label={leftCollapsed ? t.workbook.expand : t.workbook.collapse}
              >
                {leftCollapsed ? "›" : "‹"}
              </button>
            </div>
            <div className="flex-1 rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setMaterialsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/60"
                >
                  {t.workbook.materialsButton}
                </button>
              </div>

              {activeExercise === "sentences" ? (
                <>
                  {isAiActive ? (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.aiModeTitle}</p>
                      <p className="mt-3 text-sm text-ink/60">{t.workbook.aiModeHint}</p>
                      {!isActive && (
                        <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-xs text-ink/60">
                          {t.workbook.aiNeedsKey}{" "}
                          <a href="/cabinet" className="font-semibold text-ink">
                            {t.workbook.aiConnectCta}
                          </a>
                        </div>
                      )}
                      <label className="mt-4 block text-xs text-ink/60">
                        {t.workbook.aiTopicLabel}
                        <input
                          value={aiTopics[activeExercise] || ""}
                          onChange={(event) =>
                            setAiTopics((prev) => ({ ...prev, [activeExercise]: event.target.value }))
                          }
                          className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          placeholder={t.workbook.aiTopicPlaceholder}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => generateAiPrompt(activeExercise)}
                          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                          disabled={!isActive || aiStatus[activeExercise] === "loading"}
                        >
                          {aiStatus[activeExercise] === "loading"
                            ? t.common.loading
                            : t.workbook.aiGeneratePrompt}
                        </button>
                        {aiMessage && <span className="text-xs text-terracotta">{aiMessage}</span>}
                      </div>
                      {aiContent?.prompt && (
                        <div className="mt-4 rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/70">
                          {aiContent.prompt}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.contentTitle}</p>
                      {contentItems.length === 0 ? (
                        <p className="mt-3 text-sm text-ink/60">{t.workbook.contentEmpty}</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {contentItems.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => setActiveContentId(item._id)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                                activeContentId === item._id
                                  ? "border-ink bg-ink/5"
                                  : "border-ink/10 bg-paper/70 hover:border-ink/30"
                              }`}
                            >
                              <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                              <p className="mt-1 text-xs text-ink/60">{item.prompt}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.words}</p>
                    {loading ? (
                      <p className="mt-4 text-sm text-ink/60">{t.common.loading}</p>
                    ) : items.length === 0 ? (
                      <p className="mt-4 text-sm text-ink/60">{t.workbook.empty}</p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {items.map((word) => (
                          <button
                            key={word.id}
                            onClick={() => setActiveId(word.id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left ${
                              activeWord?.id === word.id
                                ? "border-ink bg-ink/5"
                                : "border-ink/10 bg-paper/70 hover:border-ink/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-ink">{word.pl}</p>
                                <p className="text-xs text-ink/50">{word.uk}</p>
                              </div>
                              <span className="text-xs text-ink/50">
                                {countSentences(word.sentences)} / 3
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.write}</p>
                    {activeWord ? (
                      <div className="mt-4 grid gap-2">
                        {activeWord.sentences.map((sentence, idx) => (
                          <div key={`${activeWord.id}-s-${idx}`} className="flex items-start gap-2">
                            <span className="mt-2 text-xs text-ink/40">{idx + 1}.</span>
                            <textarea
                              value={sentence}
                              onChange={(event) => updateSentence(activeWord.id, idx, event.target.value)}
                              rows={2}
                              className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                              placeholder={t.workbook.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-ink/60">{t.workbook.empty}</p>
                    )}
                  </div>
                </>
              ) : activeExercise === "dialogue" ? (
                <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.dialogueTitle}</p>
                  <p className="mt-2 text-sm text-ink/60">{t.workbook.dialogueHint}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block text-xs text-ink/60">
                      {t.workbook.dialogueMode}
                      <select
                        value={dialogMode}
                        onChange={(event) => setDialogMode(event.target.value as "ai" | "static")}
                        className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                      >
                        <option value="ai">{t.workbook.dialogueModeAi}</option>
                        <option value="static">{t.workbook.dialogueModeStatic}</option>
                      </select>
                    </label>
                    {dialogMode === "ai" && (
                      <>
                        <label className="block text-xs text-ink/60">
                          {t.workbook.aiTopicLabel}
                          <input
                            value={aiTopics.dialogue || ""}
                            onChange={(event) => setAiTopics((prev) => ({ ...prev, dialogue: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                            placeholder={t.workbook.aiTopicPlaceholder}
                          />
                        </label>
                        <label className="block text-xs text-ink/60">
                          {t.workbook.dialogueStartBy}
                          <select
                            value={dialogStartBy}
                            onChange={(event) => setDialogStartBy(event.target.value as "user" | "ai")}
                            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          >
                            <option value="ai">{t.workbook.dialogueStartAi}</option>
                            <option value="user">{t.workbook.dialogueStartUser}</option>
                          </select>
                        </label>
                        <div className="flex flex-wrap items-end gap-2">
                          <button
                            onClick={generateDialogPack}
                            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                            disabled={!isActive || dialogLoading}
                          >
                            {dialogLoading ? t.common.loading : t.workbook.dialogueGeneratePack}
                          </button>
                          <button
                            onClick={startRoleplay}
                            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                          >
                            {t.workbook.dialogueStartRoleplay}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {dialogMode === "ai" && !isActive && (
                    <div className="mt-3 rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-xs text-ink/60">
                      {t.workbook.aiNeedsKey}{" "}
                      <a href="/cabinet" className="font-semibold text-ink">
                        {t.workbook.aiConnectCta}
                      </a>
                    </div>
                  )}
                  {dialogMode === "ai" && dialogPack?.dialogs?.length ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.dialoguePackTitle}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {dialogPack.dialogs.map((dialog: any) => (
                          <button
                            key={dialog.id}
                            onClick={() => setDialogActiveId(dialog.id)}
                            className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                              dialogActiveId === dialog.id
                                ? "border-ink bg-ink/5"
                                : "border-ink/10 bg-paper/70 hover:border-ink/30"
                            }`}
                          >
                            <p className="font-semibold">{dialog.titleUk || dialog.titlePl}</p>
                            <p className="mt-1 text-ink/60">{dialog.titlePl}</p>
                          </button>
                        ))}
                      </div>
                      {dialogActiveId && (
                        <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                          {(dialogPack.dialogs.find((d: any) => d.id === dialogActiveId)?.turns || []).map(
                            (turn: any, idx: number) => (
                              <div key={`${dialogActiveId}-${idx}`} className="mt-2 text-sm text-ink/80">
                                <span className="text-xs text-ink/40">{turn.who}: </span>
                                {turn.pl}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {dialogMode === "static" && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.dialogueStaticTitle}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {dialogStaticDialogs.map((dialog: any) => (
                          <button
                            key={dialog._id}
                            onClick={() => setDialogActiveId(dialog._id)}
                            className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                              dialogActiveId === dialog._id
                                ? "border-ink bg-ink/5"
                                : "border-ink/10 bg-paper/70 hover:border-ink/30"
                            }`}
                          >
                            <p className="font-semibold">{dialog.title || t.workbook.contentUntitled}</p>
                            <p className="mt-1 text-ink/60">{dialog.level || "A1"}</p>
                          </button>
                        ))}
                      </div>
                      {dialogActiveId && (
                        <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                          {(dialogStaticDialogs.find((d: any) => d._id === dialogActiveId)?.content?.dialogs?.[0]?.turns || [])
                            .map((turn: any, idx: number) => (
                              <div key={`${dialogActiveId}-static-${idx}`} className="mt-2 text-sm text-ink/80">
                                <span className="text-xs text-ink/40">{turn.who}: </span>
                                {turn.pl}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {dialogMode === "ai" && (
                    <div className="mt-6 rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.dialogueRoleplay}</p>
                      <div className="mt-3 space-y-2">
                        {dialogRoleplay.length === 0 && (
                          <p className="text-sm text-ink/60">{t.workbook.dialogueRoleplayEmpty}</p>
                        )}
                        {dialogRoleplay.map((msg, idx) => (
                          <div
                            key={`rp-${idx}`}
                            className={`rounded-2xl border px-3 py-2 text-sm ${
                              msg.role === "user" ? "border-ink/20 bg-paper" : "border-moss/20 bg-moss/10"
                            }`}
                          >
                            <span className="text-xs text-ink/40">
                              {msg.role === "user" ? t.workbook.dialogueYou : t.workbook.dialogueAi}
                            </span>
                            <p className="mt-1">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={dialogInput}
                          onChange={(event) => setDialogInput(event.target.value)}
                          className="flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          placeholder={t.workbook.dialoguePlaceholder}
                        />
                        <button
                          onClick={sendRoleplayTurn}
                          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                          disabled={dialogLoading}
                        >
                          {dialogLoading ? t.common.loading : t.workbook.dialogueSend}
                        </button>
                        <button
                          onClick={checkDialogRoleplay}
                          className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                          disabled={dialogLoading || dialogRoleplay.length === 0}
                        >
                          {t.workbook.dialogueCheck}
                        </button>
                      </div>
                      {dialogFeedback && (
                        <div className="mt-4 rounded-2xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink/70">
                          <p className="font-semibold">{t.workbook.dialogueSummary}</p>
                          <p className="mt-2">{dialogFeedback.feedback}</p>
                          <p className="mt-2 text-xs text-ink/50">{dialogFeedback.improvedSample}</p>
                          {Array.isArray(dialogFeedback.suggestedVocab) && dialogFeedback.suggestedVocab.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {dialogFeedback.suggestedVocab.map((item: any, idx: number) => {
                                const key = `${item.lemma}|||${item.meaning}`;
                                const status = dialogSuggestedStatus[key] || "idle";
                                return (
                                  <div
                                    key={`dlg-sugg-${idx}`}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 text-xs"
                                  >
                                    <div>
                                      <p className="font-semibold">{item.lemma}</p>
                                      <p className="text-ink/60">{item.meaning}</p>
                                    </div>
                                    <button
                                      onClick={() => addDialogSuggested(item.lemma, item.meaning)}
                                      className="rounded-full border border-ink/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                                      disabled={status === "saving" || status === "done"}
                                    >
                                      {status === "done"
                                        ? t.workbook.translateAdded
                                        : status === "saving"
                                          ? t.common.loading
                                          : t.workbook.translateAddVocab}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeExercise === "paraphrase" ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.paraphraseTitle}</p>
                    <p className="mt-2 text-sm text-ink/60">{t.workbook.paraphraseHint}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="block text-xs text-ink/60">
                        {t.workbook.paraphraseMode}
                        <select
                          value={paraphraseMode}
                          onChange={(event) => setParaphraseMode(event.target.value as "ai" | "static")}
                          className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                        >
                          <option value="ai">{t.workbook.paraphraseModeAi}</option>
                          <option value="static">{t.workbook.paraphraseModeStatic}</option>
                        </select>
                      </label>
                      {paraphraseMode === "ai" && (
                        <>
                          <label className="block text-xs text-ink/60">
                            {t.workbook.aiTopicLabel}
                            <input
                              value={paraphraseTopic}
                              onChange={(event) => setParaphraseTopic(event.target.value)}
                              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                              placeholder={t.workbook.aiTopicPlaceholder}
                            />
                          </label>
                          <label className="block text-xs text-ink/60">
                            {t.workbook.paraphraseCount}
                            <input
                              type="number"
                              min={3}
                              max={20}
                              value={paraphraseGenerateCount}
                              onChange={(event) => setParaphraseGenerateCount(Number(event.target.value || 5))}
                              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                            />
                          </label>
                          <div className="flex flex-wrap items-end gap-2">
                            <button
                              onClick={generateParaphrasePack}
                              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                              disabled={!isActive || paraphraseLoading}
                            >
                              {paraphraseLoading ? t.common.loading : t.workbook.paraphraseGenerate}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {paraphraseMode === "ai" && !isActive && (
                      <div className="mt-3 rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-xs text-ink/60">
                        {t.workbook.aiNeedsKey}{" "}
                        <a href="/cabinet" className="font-semibold text-ink">
                          {t.workbook.aiConnectCta}
                        </a>
                      </div>
                    )}
                  </div>

                  {paraphraseMode === "static" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.contentTitle}</p>
                      {paraphraseMaterials.length === 0 ? (
                        <p className="mt-3 text-sm text-ink/60">{t.workbook.contentEmpty}</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {paraphraseMaterials.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => {
                                setActiveParaphraseId(item._id);
                                setParaphraseAnswers({});
                                setParaphraseResult(null);
                              }}
                              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                                activeParaphraseId === item._id
                                  ? "border-ink bg-ink/5"
                                  : "border-ink/10 bg-paper/70 hover:border-ink/30"
                              }`}
                            >
                              <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                              <p className="mt-1 text-xs text-ink/50">{item.level || "A1"}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.paraphraseTask}</p>
                    <div className="mt-3 space-y-4">
                      {(paraphraseMode === "ai" ? paraphraseTask?.items || [] : paraphraseMaterials.find((m) => m._id === activeParaphraseId)?.content?.items || [])
                        .map((item: any, idx: number) => (
                          <div key={item.id || idx} className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                              {t.workbook.paraphraseSentence} {idx + 1}
                            </p>
                            <p className="mt-2 text-sm text-ink/80">{item.sourcePl}</p>
                            {(item.instructionUk || item.instructionPl) && (
                              <p className="mt-2 text-xs text-ink/60">{item.instructionUk || item.instructionPl}</p>
                            )}
                            <textarea
                              value={paraphraseAnswers[item.id] || ""}
                              onChange={(event) =>
                                setParaphraseAnswers((prev) => ({ ...prev, [item.id]: event.target.value }))
                              }
                              rows={2}
                              className="mt-3 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                              placeholder={t.workbook.paraphrasePlaceholder}
                            />
                            {paraphraseResult?.items?.find((r: any) => r.id === item.id) && (
                              <div className="mt-3 rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 text-xs text-ink/70">
                                <p className="font-semibold">
                                  {t.workbook.paraphraseScore}:{" "}
                                  {Math.round((paraphraseResult.items.find((r: any) => r.id === item.id).score01 || 0) * 100)}%
                                </p>
                                <p className="mt-2">
                                  {paraphraseResult.items.find((r: any) => r.id === item.id).quickFeedbackUk}
                                </p>
                                {paraphraseResult.items.find((r: any) => r.id === item.id).improvedUserVersionPl && (
                                  <p className="mt-2 text-ink/60">
                                    {paraphraseResult.items.find((r: any) => r.id === item.id).improvedUserVersionPl}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setParaphraseFocusIndex(0);
                          setParaphraseFocusOpen(true);
                        }}
                        className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                      >
                        {t.workbook.focusMode}
                      </button>
                      <button
                        onClick={checkParaphrase}
                        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                        disabled={paraphraseLoading}
                      >
                        {paraphraseLoading ? t.common.loading : t.workbook.paraphraseCheck}
                      </button>
                      {paraphraseResult?.overall && (
                        <span className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink/60">
                          {t.workbook.paraphrasePoints}:{" "}
                          {paraphraseAwardedPoints ?? paraphraseResult.overall.pointsForRating}
                        </span>
                      )}
                    </div>
                    {paraphraseWarning && (
                      <div className="mt-3 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-xs text-terracotta">
                        {paraphraseWarning}
                      </div>
                    )}
                    {Array.isArray(paraphraseResult?.suggestedVocab) && paraphraseResult.suggestedVocab.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-ink/10 bg-paper px-3 py-3 text-xs">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.translateSuggestedTitle}</p>
                        <div className="mt-2 space-y-2">
                          {paraphraseResult.suggestedVocab.map((item: any, idx: number) => {
                            const key = `${item.lemma}|||${item.meaningUk || item.meaning}`;
                            const status = paraphraseSuggestedStatus[key] || "idle";
                            return (
                              <div key={`pp-s-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2">
                                <div>
                                  <p className="font-semibold">{item.lemma}</p>
                                  <p className="text-ink/60">{item.meaningUk || item.meaning}</p>
                                </div>
                                <button
                                  onClick={() => addParaphraseSuggested(item.lemma, item.meaningUk || item.meaning)}
                                  className="rounded-full border border-ink/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                                  disabled={status === "saving" || status === "done"}
                                >
                                  {status === "done"
                                    ? t.workbook.translateAdded
                                    : status === "saving"
                                      ? t.common.loading
                                      : t.workbook.translateAddVocab}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeExercise === "cloze" ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.contentTitle}</p>
                    {clozeMaterials.length === 0 ? (
                      <p className="mt-3 text-sm text-ink/60">{t.workbook.contentEmpty}</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {clozeMaterials.map((item) => (
                          <button
                            key={item._id}
                            onClick={() => {
                              setActiveClozeId(item._id);
                              setClozeAnswers({});
                              setClozeChecked(false);
                              setClozeScore(null);
                              setClozePoints(null);
                              if (clozeFocusOnStart) {
                                setClozeFocusId(item._id);
                              }
                            }}
                            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                              activeClozeId === item._id
                                ? "border-ink bg-ink/5"
                                : "border-ink/10 bg-paper/70 hover:border-ink/30"
                            }`}
                          >
                            <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                            <p className="mt-1 text-xs text-ink/50">{item.level || "A1"}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeCloze ? (
                    <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.clozeTitle}</p>
                          <p className="mt-2 text-sm text-ink/60">{t.workbook.clozeHint}</p>
                        </div>
                        <button
                          onClick={() => setClozeFocusId(activeClozeId)}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                        >
                          {t.workbook.clozeFocus}
                        </button>
                      </div>
                      <div className="mt-4 space-y-4">
                        {(activeCloze.content?.items || []).map((item: any, idx: number) => {
                          const parts = String(item.text || "").split("___");
                          const itemKeyBase = item.id || idx;
                          return (
                            <div key={itemKeyBase} className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                                  {t.workbook.clozeItem} {idx + 1}
                                </p>
                                <button
                                  onClick={() =>
                                    setClozeHintsOpen((prev) => {
                                      const current = prev[String(itemKeyBase)] ?? clozeHintsDefault;
                                      return { ...prev, [String(itemKeyBase)]: !current };
                                    })
                                  }
                                  className="text-[10px] uppercase tracking-[0.2em] text-ink/50"
                                >
                                  {(clozeHintsOpen[String(itemKeyBase)] ?? clozeHintsDefault)
                                    ? t.workbook.clozeHideHints
                                    : t.workbook.clozeHints}
                                </button>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/80">
                                {parts.map((part: string, partIndex: number) => {
                                  const gapIndex = partIndex;
                                  const gap = item.gaps?.[gapIndex];
                                  if (!gap) return <span key={`${itemKeyBase}-p-${partIndex}`}>{part}</span>;
                                  const key = `${itemKeyBase}-${gapIndex}`;
                                  const value = clozeAnswers[key] || "";
                                  const correct = isGapCorrect(gap, value);
                                  return (
                                    <span key={`${itemKeyBase}-g-${partIndex}`} className="inline-flex items-center gap-2">
                                      <span>{part}</span>
                              <input
                                value={value}
                                onChange={(event) =>
                                  setClozeAnswers((prev) => ({ ...prev, [key]: event.target.value }))
                                }
                                        className={`w-32 rounded-full border px-3 py-1 text-sm transition ${
                                          !value
                                            ? "border-ink/20 bg-paper"
                                            : correct
                                              ? "border-moss/40 bg-moss/10"
                                              : "border-terracotta/40 bg-terracotta/10"
                                        }`}
                                        placeholder={t.workbook.clozePlaceholder}
                                      />
                                    </span>
                                  );
                                })}
                              </div>
                              {(clozeHintsOpen[String(itemKeyBase)] ?? clozeHintsDefault) && (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/50">
                                  {(item.gaps || []).map((gap: any, gapIdx: number) => (
                                    <span key={`${itemKeyBase}-h-${gapIdx}`} className="rounded-full border border-ink/10 bg-paper px-2 py-1">
                                      {gap.hint || t.workbook.clozeHintEmpty}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                        {clozeTrainingActive && clozeQueue.length > 0 && (
                          <span className="text-xs text-ink/50">
                            {t.workbook.materialProgress} {Math.min(clozeQueueIndex + 1, clozeQueue.length)} / {clozeQueue.length}
                          </span>
                        )}
                        <button
                          onClick={async () => {
                            if (!activeCloze || clozeAwarded) return;
                            const result = computeClozeScore(activeCloze, clozeAnswers);
                            const res = await fetch("/api/exercises/attempt", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ type: "cloze", materialId: activeCloze._id, score: result.score })
                            });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok) {
                              setClozePoints(Number(data?.points || 0));
                              setClozeAwarded(true);
                            }
                          }}
                          className="rounded-full bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-60"
                          disabled={clozeAwarded}
                        >
                          {clozeAwarded ? t.workbook.clozeAwarded : t.workbook.clozeAward}
                        </button>
                        {clozeTrainingActive && clozeQueue.length > 0 && (
                          <button
                            onClick={() => {
                              const nextIndex = clozeQueueIndex + 1;
                              if (nextIndex >= clozeQueue.length) return;
                              setClozeQueueIndex(nextIndex);
                              const nextId = clozeQueue[nextIndex];
                          setActiveClozeId(nextId);
                          setClozeAnswers({});
                          setClozeChecked(false);
                          setClozeScore(null);
                          setClozePoints(null);
                          setClozeAwarded(false);
                            }}
                            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                          >
                            {t.workbook.materialNext}
                          </button>
                        )}
                        {clozeChecked && (
                          <span className="text-xs text-ink/60">
                            {t.workbook.clozeResult} {Math.round((clozeScore || 0) * 100)}%
                          </span>
                        )}
                        {clozePoints !== null && (
                          <span className="text-xs text-moss">+{clozePoints} {t.workbook.points}</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : activeExercise === "match" ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchTitle}</p>
                        <p className="mt-2 text-sm text-ink/60">{t.workbook.matchHint}</p>
                        {matchAutoEnabled && (
                          <p className="mt-2 text-xs text-moss">{t.workbook.matchAutoActive}</p>
                        )}
                        {matchAutoLastUsed && (
                          <p className="mt-1 text-[11px] text-ink/50">
                            {t.workbook.matchAutoLastUsed}{" "}
                            {new Date(matchAutoLastUsed).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={loadMatchAuto}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                          disabled={matchAutoLoading}
                        >
                          {matchAutoLoading ? t.workbook.matchAutoLoading : t.workbook.matchAutoButton}
                        </button>
                        <button
                          onClick={() => setMatchFocusOpen(true)}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                        >
                          {t.workbook.matchFocus}
                        </button>
                        <button
                          onClick={() => setMaterialsOpen(true)}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                        >
                          {t.workbook.materialsButton}
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchLeft}</p>
                        {matchLeft.map((item) => {
                          const matched = matchMatched[item];
                          const isActive = matchSelectedLeft === item;
                          return (
                            <button
                              key={item}
                              onClick={() => setMatchSelectedLeft(item)}
                              className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition ${
                                matched
                                  ? "border-moss/30 bg-moss/10 text-moss"
                                  : isActive
                                    ? "border-ink bg-ink/5"
                                    : "border-ink/10 bg-paper/70 hover:border-ink/30"
                              }`}
                              disabled={Boolean(matched)}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchRight}</p>
                        {matchRight.map((item) => {
                          const matched = Object.values(matchMatched).includes(item);
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                if (!matchSelectedLeft || matched) return;
                                const pair = activeMatch?.content?.pairs?.find((p: any) => p.left === matchSelectedLeft);
                          const correct = pair?.right === item;
                          if (correct) {
                            setMatchMatched((prev) => ({ ...prev, [matchSelectedLeft]: item }));
                          }
                          setMatchSelectedLeft(null);
                                if (activeMatch) {
                                  const total = (activeMatch.content?.pairs || []).length || 0;
                                  const correctCount = Object.keys({ ...matchMatched, ...(correct ? { [matchSelectedLeft]: item } : {}) }).length;
                                  setMatchScore(total === 0 ? 0 : correctCount / total);
                                }
                              }}
                              className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition ${
                                matched
                                  ? "border-moss/30 bg-moss/10 text-moss"
                                  : "border-ink/10 bg-paper/70 hover:border-ink/30"
                              }`}
                              disabled={matched}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                      <button
                        onClick={async () => {
                          if (!activeMatch || matchAwarded) return;
                          const total = (activeMatch.content?.pairs || []).length || 0;
                          const correctCount = Object.keys(matchMatched).length;
                          const score = total === 0 ? 0 : correctCount / total;
                          setMatchScore(score);
                          const res = await fetch("/api/exercises/attempt", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "match", materialId: activeMatch._id, score })
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setMatchPoints(Number(data?.points || 0));
                            setMatchAwarded(true);
                            setMatchResultOpen(true);
                          }
                        }}
                        className="rounded-full bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-60"
                        disabled={matchAwarded}
                      >
                        {matchAwarded ? t.workbook.matchAwarded : t.workbook.matchAward}
                      </button>
                      <span className="text-xs text-ink/60">
                        {t.workbook.matchProgress} {Object.keys(matchMatched).length} / {matchLeft.length}
                      </span>
                      {matchPoints !== null && (
                        <span className="text-xs text-moss">+{matchPoints} {t.workbook.points}</span>
                      )}
                      {matchTrainingActive && matchQueue.length > 0 && (
                        <button
                          onClick={() => {
                            const nextIndex = matchQueueIndex + 1;
                            if (nextIndex >= matchQueue.length) return;
                            setMatchQueueIndex(nextIndex);
                            const nextId = matchQueue[nextIndex];
                            setActiveMatchId(nextId);
                            const nextMaterial = matchMaterials.find((item) => item._id === nextId);
                            initMatch(nextMaterial);
                          }}
                          className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                        >
                          {t.workbook.materialNext}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-4 text-sm text-ink/60">
                  {activeExercise === "translate" ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.translateTitle}</p>
                          <p className="mt-2 text-sm text-ink/60">{t.workbook.translateHint}</p>
                        </div>
                        <button
                          onClick={generateTranslateTask}
                          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                          disabled={!isActive || translateLoading}
                        >
                          {translateLoading ? t.common.loading : t.workbook.translateGenerate}
                        </button>
                      </div>
                      {!isActive && (
                        <div className="rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-xs text-ink/60">
                          {t.workbook.aiNeedsKey}{" "}
                          <a href="/cabinet" className="font-semibold text-ink">
                            {t.workbook.aiConnectCta}
                          </a>
                        </div>
                      )}
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block text-xs text-ink/60">
                          {t.workbook.translateTopic}
                          <input
                            value={translatePrompt}
                            onChange={(event) => setTranslatePrompt(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                            placeholder={t.workbook.translateTopicPlaceholder}
                          />
                        </label>
                        <label className="block text-xs text-ink/60">
                          {t.workbook.translateCount}
                          <input
                            type="number"
                            value={translateCount}
                            onChange={(event) =>
                              setTranslateCount(Math.max(3, Math.min(20, Number(event.target.value) || 3)))
                            }
                            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs text-ink/60">
                          {t.workbook.translateDirection}
                          <select
                            value={translateDirection}
                            onChange={(event) =>
                              setTranslateDirection(event.target.value as "uk_to_pl" | "pl_to_uk")
                            }
                            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          >
                            <option value="uk_to_pl">{t.workbook.translateUkPl}</option>
                            <option value="pl_to_uk">{t.workbook.translatePlUk}</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink/60">
                          <input
                            type="checkbox"
                            checked={translateUseVocab}
                            onChange={(event) => setTranslateUseVocab(event.target.checked)}
                          />
                          {t.workbook.translateUseVocab}
                        </label>
                      </div>
                      {aiMessage && (
                        <div className="rounded-2xl border border-terracotta/40 bg-paper/80 px-4 py-3 text-xs text-terracotta">
                          {aiMessage}
                        </div>
                      )}
                      {translateTask && (
                        <div className="mt-4 space-y-3">
                          {translateTask.items.map((item, index) => {
                            const itemResult = translateResult?.items?.find((resItem: any) => resItem.id === item.id);
                            const verdict = itemResult?.verdict;
                            const verdictLabel =
                              verdict === "ok"
                                ? t.workbook.translateVerdictOk
                                : verdict === "weak"
                                  ? t.workbook.translateVerdictWeak
                                  : verdict === "bad"
                                    ? t.workbook.translateVerdictBad
                                    : "";
                            return (
                            <div key={item.id} className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                                {t.workbook.translateItem} {index + 1}
                              </p>
                              {itemResult?.score01 !== undefined && (
                                <p className="mt-1 text-xs text-ink/50">
                                  {t.workbook.translateItemScore}{" "}
                                  {Math.round(
                                    (itemResult?.score01 || 0) * 100
                                  )}%
                                </p>
                              )}
                              <p className="mt-2 text-sm text-ink/80">{item.source}</p>
                              <textarea
                                value={translateAnswers[item.id] || ""}
                                onChange={(event) =>
                                  setTranslateAnswers((prev) => ({ ...prev, [item.id]: event.target.value }))
                                }
                                rows={2}
                                title={itemResult?.quickFeedback || ""}
                                className={`mt-3 w-full rounded-2xl border px-4 py-2 text-sm ${
                                  verdict === "bad"
                                    ? "border-terracotta/50 bg-terracotta/5"
                                    : verdict === "weak"
                                      ? "border-ink/30 bg-paper"
                                      : verdict === "ok"
                                        ? "border-moss/40 bg-moss/10"
                                        : "border-ink/20 bg-paper"
                                }`}
                                placeholder={t.workbook.translatePlaceholder}
                              />
                              {verdictLabel && (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink/60">
                                  {verdict === "ok" && <CheckCircle size={14} className="text-moss" />}
                                  {verdict === "weak" && <WarningCircle size={14} className="text-ink/50" />}
                                  {verdict === "bad" && <XCircle size={14} className="text-terracotta" />}
                                  {verdictLabel}
                                  {itemResult?.quickFeedback && (
                                    <span className="inline-flex items-center" title={itemResult.quickFeedback}>
                                      <Info size={12} className="text-ink/40" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )})}
                          <button
                            onClick={checkTranslateTask}
                            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                            disabled={translateLoading}
                          >
                            {translateLoading ? t.common.loading : t.workbook.translateCheck}
                          </button>
                        </div>
                      )}
                      {translateResult && (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/70">
                            <p className="font-semibold">{t.workbook.translateSummary}</p>
                            <p className="mt-2">
                              {t.workbook.translateScore} {Math.round((translateResult?.overall?.score01 || 0) * 100)}%
                            </p>
                            <p>
                              {t.workbook.translatePoints} +{translateResult?.overall?.pointsForRating || 0}
                            </p>
                          </div>

                          {(translateResult.items || []).map((item: any) => (
                            <div key={item.id} className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm font-semibold">{t.workbook.translateFeedbackTitle}</p>
                                <span
                                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                                    item.verdict === "ok"
                                      ? "bg-moss/20 text-moss"
                                      : item.verdict === "weak"
                                        ? "bg-ink/10 text-ink/60"
                                        : "bg-terracotta/20 text-terracotta"
                                  }`}
                                >
                                  {item.verdict || "-"}
                                </span>
                              </div>
                              {item.quickFeedback && (
                                <p className="mt-2 text-sm text-ink/70">{item.quickFeedback}</p>
                              )}
                              {Array.isArray(item.reference) && item.reference.length > 0 && (
                                <div className="mt-3 text-xs text-ink/60">
                                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">
                                    {t.workbook.translateReference}
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    {item.reference.map((ref: string, idx: number) => (
                                      <p key={`${item.id}-ref-${idx}`} className="rounded-xl border border-ink/10 bg-paper/80 px-3 py-2">
                                        {ref}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(item.notes) && item.notes.length > 0 && (
                                <div className="mt-3 text-xs text-ink/60">
                                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">
                                    {t.workbook.translateNotes}
                                  </p>
                                  <ul className="mt-2 space-y-1">
                                    {item.notes.map((note: string, idx: number) => (
                                      <li key={`${item.id}-note-${idx}`} className="rounded-xl border border-ink/10 bg-paper/80 px-3 py-2">
                                        {note}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-semibold">{t.workbook.translateSuggestedTitle}</p>
                              {Array.isArray(translateResult.suggestedVocab) && translateResult.suggestedVocab.length > 0 && (
                                <button
                                  onClick={addAllSuggestedVocab}
                                  className="rounded-full border border-ink/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                                  disabled={translateBulkLoading}
                                >
                                  {translateBulkLoading ? t.common.loading : t.workbook.translateAddAll}
                                </button>
                              )}
                            </div>
                            {Array.isArray(translateResult.suggestedVocab) && translateResult.suggestedVocab.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {translateResult.suggestedVocab.map((item: any, idx: number) => {
                                  const key = `${item.lemma}|||${item.meaning || item.meaningUk || "-"}`;
                                  const status = translateVocabStatus[key] || "idle";
                                  return (
                                    <div key={`${item.lemma}-${idx}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 text-xs">
                                      <div>
                                        <p className="text-sm font-semibold">{item.lemma}</p>
                                        <p className="text-xs text-ink/60">{item.meaning || item.meaningUk || "-"}</p>
                                        {item.reason && <p className="text-[10px] text-ink/50">{item.reason}</p>}
                                      </div>
                                      <button
                                        onClick={() => addSuggestedVocab(item.lemma, item.meaning || item.meaningUk || "-")}
                                        className="rounded-full border border-ink/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                                        disabled={status === "saving" || status === "done"}
                                      >
                                        {status === "done"
                                          ? t.workbook.translateAdded
                                          : status === "saving"
                                            ? t.common.loading
                                            : t.workbook.translateAddVocab}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-ink/60">{t.workbook.translateNoSuggestions}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-ink">{t.workbook.comingSoonTitle}</p>
                      <p className="mt-2 text-sm text-ink/60">{t.workbook.comingSoonText}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t.workbook.historyTitle}</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-ink/40">{entries.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {entries.length === 0 ? (
                <p className="text-sm text-ink/60">{t.workbook.historyEmpty}</p>
              ) : (
                entries.map((entry) => {
                  const submission = submissions.find((item) => item.entryId === entry.id);
                  return (
                    <div key={entry.id} className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {t.workbook.entry} #{entry.number}
                          </p>
                          <p className="text-xs text-ink/50">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs">
                            {t.workbook.pointsLabel}: {entry.totalPoints.toFixed(2)}
                          </span>
                          {submission ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                submission.status === "reviewed"
                                  ? "bg-moss/20 text-moss"
                                  : "bg-ink/10 text-ink/70"
                              }`}
                            >
                              {submission.status === "reviewed" ? t.messages.reviewed : t.messages.pending}
                            </span>
                          ) : (
                            <button
                              onClick={() => submitForReview(entry)}
                              className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                            >
                              {submitStatus[entry.id] === "saving" ? t.common.loading : t.messages.sendReview}
                            </button>
                          )}
                          <a
                            href={`data:text/plain;charset=utf-8,${encodeURIComponent(entry.formattedText)}`}
                            download={`workbook_${entry.number}.txt`}
                            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                          >
                            {t.workbook.download}
                          </a>
                          <button
                            onClick={() => setExpandedEntry((prev) => (prev === entry.id ? null : entry.id))}
                            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                          >
                            {expandedEntry === entry.id ? t.common.hide : t.workbook.show}
                          </button>
                        </div>
                      </div>
                      {expandedEntry === entry.id && (
                        <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
                          {entry.formattedText}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {activeTab === "setup" && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.exerciseSettingsTitle}</p>
            <p className="mt-3 text-sm text-ink/60">{t.workbook.exerciseSettingsHint}</p>
            {activeExercise === "sentences" ? (
              <div className="mt-4 space-y-2 text-xs text-ink/60">
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.mode}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">{t.workbook.settings.practice}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.hints}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">{t.workbook.settings.on}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.time}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">{t.workbook.settings.off}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-4 text-sm text-ink/60">
                <p className="font-semibold text-ink">{t.workbook.comingSoonTitle}</p>
                <p className="mt-2 text-sm text-ink/60">{t.workbook.comingSoonText}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {taskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {activeExercise === "dialogue" ? t.workbook.dialogueTitle : t.workbook.write}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{activeWord?.pl || "-"}</h3>
                  <p className="text-sm text-ink/60">{activeWord?.uk || ""}</p>
                </div>
                <div className="text-xs text-ink/50">
                  {activeIndex + 1} / {items.length}
                </div>
              </div>
              {activeExercise === "sentences" && (
                <div className="mt-4 flex items-center gap-3 text-xs text-ink/50">
                  <span>
                    {t.workbook.sentences}: {countSentences(activeWord?.sentences || [])} / 3
                  </span>
                  <span>
                    {t.workbook.points}: {scoreForCount(countSentences(activeWord?.sentences || []))}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {activeExercise === "sentences" ? (
                activeWord ? (
                  <div className="grid gap-2">
                    {activeWord.sentences.map((sentence, idx) => (
                      <div key={`${activeWord.id}-s-${idx}`} className="flex items-start gap-2">
                        <span className="mt-2 text-xs text-ink/40">{idx + 1}.</span>
                        <textarea
                          value={sentence}
                          onChange={(event) => updateSentence(activeWord.id, idx, event.target.value)}
                          rows={2}
                          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                          placeholder={t.workbook.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/60">{t.workbook.empty}</p>
                )
              ) : activeExercise === "dialogue" ? (
                activeWord ? (
                  <div className="space-y-3">
                    <p className="text-sm text-ink/60">{t.workbook.dialogueHint}</p>
                    {(aiContent?.prompt || activeContent?.prompt) && (
                      <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/70">
                        {aiContent?.prompt || activeContent?.prompt}
                      </div>
                    )}
                    {(dialogueMap[activeWord.id] || ["", "", "", ""]).map((line, idx) => {
                      const speaker = idx % 2 === 0 ? t.workbook.speakerA : t.workbook.speakerB;
                      return (
                        <div key={`${activeWord.id}-md-${idx}`} className="flex items-start gap-3">
                          <span className="mt-2 rounded-full border border-ink/10 bg-paper px-2 py-1 text-[10px] uppercase text-ink/60">
                            {speaker}
                          </span>
                          <textarea
                            value={line}
                            onChange={(event) =>
                              setDialogueMap((prev) => ({
                                ...prev,
                                [activeWord.id]: (prev[activeWord.id] || ["", "", "", ""]).map((item, i) =>
                                  i === idx ? event.target.value : item
                                )
                              }))
                            }
                            rows={2}
                            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                            placeholder={t.workbook.dialoguePlaceholder}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-ink/60">{t.workbook.empty}</p>
                )
              ) : (
                <div className="rounded-2xl border border-ink/10 bg-paper/70 px-6 py-6 text-sm text-ink/60">
                  <p className="text-base font-semibold text-ink">{t.workbook.comingSoonTitle}</p>
                  <p className="mt-2">{t.workbook.comingSoonText}</p>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5 text-xs">
              <button
                onClick={() => setActiveId(items[Math.max(activeIndex - 1, 0)]?.id || activeWord?.id || null)}
                className="rounded-full border border-ink/10 px-4 py-2"
                disabled={activeIndex <= 0}
              >
                {t.workbook.prev}
              </button>
              <button
                onClick={() =>
                  setActiveId(items[Math.min(activeIndex + 1, items.length - 1)]?.id || activeWord?.id || null)
                }
                className="rounded-full border border-ink/10 px-4 py-2"
                disabled={activeIndex >= items.length - 1}
              >
                {t.workbook.next}
              </button>
              {activeExercise === "sentences" && (
                <button
                  onClick={saveEntry}
                  className="rounded-full bg-moss px-4 py-2 font-semibold text-paper"
                  disabled={loading || items.length === 0}
                >
                  {saveStatus === "saving" ? t.common.loading : t.workbook.save}
                </button>
              )}
              <button
                onClick={() => setTaskOpen(false)}
                className="ml-auto rounded-full border border-ink/20 px-4 py-2"
              >
                {t.common.close}
              </button>
              {saveStatus === "done" && <span className="text-xs text-moss">{t.workbook.saved}</span>}
              {saveStatus === "error" && <span className="text-xs text-terracotta">{t.workbook.saveError}</span>}
            </div>
          </div>
        </div>
      )}
      {paraphraseFocusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.paraphraseTitle}</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {t.workbook.paraphraseSentence} {paraphraseFocusIndex + 1}
                  </h3>
                </div>
                <button
                  onClick={() => setParaphraseFocusOpen(false)}
                  className="rounded-full border border-ink/10 px-3 py-1 text-xs"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {(() => {
                const items =
                  paraphraseMode === "ai"
                    ? paraphraseTask?.items || []
                    : paraphraseMaterials.find((m) => m._id === activeParaphraseId)?.content?.items || [];
                const item = items[paraphraseFocusIndex];
                if (!item) {
                  return <p className="text-sm text-ink/60">{t.workbook.empty}</p>;
                }
                return (
                  <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-4">
                    <p className="text-sm text-ink/80">{item.sourcePl}</p>
                    {(item.instructionUk || item.instructionPl) && (
                      <p className="mt-2 text-xs text-ink/60">{item.instructionUk || item.instructionPl}</p>
                    )}
                    <textarea
                      value={paraphraseAnswers[item.id] || ""}
                      onChange={(event) =>
                        setParaphraseAnswers((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      rows={3}
                      className="mt-3 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                      placeholder={t.workbook.paraphrasePlaceholder}
                    />
                    {paraphraseResult?.items?.find((r: any) => r.id === item.id) && (
                      <div className="mt-3 rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 text-xs text-ink/70">
                        <p className="font-semibold">
                          {t.workbook.paraphraseScore}:{" "}
                          {Math.round((paraphraseResult.items.find((r: any) => r.id === item.id).score01 || 0) * 100)}%
                        </p>
                        <p className="mt-2">{paraphraseResult.items.find((r: any) => r.id === item.id).quickFeedbackUk}</p>
                        {paraphraseResult.items.find((r: any) => r.id === item.id).improvedUserVersionPl && (
                          <p className="mt-2 text-ink/60">
                            {paraphraseResult.items.find((r: any) => r.id === item.id).improvedUserVersionPl}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5 text-xs">
              <button
                onClick={() => setParaphraseFocusIndex((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-ink/10 px-4 py-2"
                disabled={paraphraseFocusIndex <= 0}
              >
                {t.workbook.prev}
              </button>
              <button
                onClick={() => {
                  const items =
                    paraphraseMode === "ai"
                      ? paraphraseTask?.items || []
                      : paraphraseMaterials.find((m) => m._id === activeParaphraseId)?.content?.items || [];
                  setParaphraseFocusIndex((prev) => Math.min(prev + 1, Math.max(items.length - 1, 0)));
                }}
                className="rounded-full border border-ink/10 px-4 py-2"
              >
                {t.workbook.next}
              </button>
            </div>
          </div>
        </div>
      )}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.exerciseSettingsTitle}</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {exerciseTypes.find((ex) => ex.id === settingsOpen)?.title}
                </h3>
              </div>
              <button
                onClick={() => setSettingsOpen(null)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs"
              >
                {t.common.close}
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-ink/70">
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                <span>{t.workbook.settings.ai}</span>
                <button
                  onClick={() =>
                    setAiEnabled((prev) => ({ ...prev, [settingsOpen]: !prev[settingsOpen] }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    aiEnabled[settingsOpen] ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper text-ink/60"
                  }`}
                >
                  {aiEnabled[settingsOpen] ? t.workbook.settings.on : t.workbook.settings.off}
                </button>
              </div>
              <p className="text-xs text-ink/50">{t.workbook.settings.aiHint}</p>
              {aiEnabled[settingsOpen] && !isActive && (
                <p className="text-xs text-terracotta">{t.workbook.aiNeedsKey}</p>
              )}
            </div>
            {settingsOpen === "sentences" ? (
              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <div className="rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">{t.workbook.chooseGroups}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {typeOptions.map((option) => {
                      const active = selectedTypes.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            setSelectedTypes((prev) =>
                              prev.includes(option.id)
                                ? prev.filter((item) => item !== option.id)
                                : [...prev, option.id]
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            active ? "border-ink bg-ink/5" : "border-ink/10 bg-paper/80"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeFavorites}
                        onChange={(event) => setIncludeFavorites(event.target.checked)}
                      />
                      {t.deck.favorites}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeMyWords}
                        onChange={(event) => setIncludeMyWords(event.target.checked)}
                      />
                      {t.deck.myWords}
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.wordCount}</span>
                  <input
                    type="number"
                    value={count}
                    onChange={(event) => setCount(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
                    className="w-20 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs"
                    min={1}
                    max={30}
                  />
                </div>
                <button
                  onClick={async () => {
                    await generateWords();
                    setTaskOpen(true);
                    setSettingsOpen(null);
                  }}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {t.workbook.startExercise}
                </button>
              </div>
            ) : settingsOpen === "dialogue" ? (
              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.speakers}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">{t.workbook.settings.ab}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.lines}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">4</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.hints}</span>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">{t.workbook.settings.on}</span>
                </div>
                <button
                  onClick={() => {
                    setTaskOpen(true);
                    setSettingsOpen(null);
                  }}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {t.workbook.startExercise}
                </button>
              </div>
            ) : settingsOpen === "cloze" ? (
              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.hints}</span>
                  <button
                    onClick={() => setClozeHintsDefault((prev) => !prev)}
                    className="rounded-full border border-ink/10 bg-paper px-3 py-1"
                  >
                    {clozeHintsDefault ? t.workbook.settings.on : t.workbook.settings.off}
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.focus}</span>
                  <button
                    onClick={() => setClozeFocusOnStart((prev) => !prev)}
                    className="rounded-full border border-ink/10 bg-paper px-3 py-1"
                  >
                    {clozeFocusOnStart ? t.workbook.settings.on : t.workbook.settings.off}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialRandom}
                      onChange={(event) => setMaterialRandom(event.target.checked)}
                    />
                    {t.workbook.materialsRandom}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialInfinite}
                      onChange={(event) => setMaterialInfinite(event.target.checked)}
                    />
                    {t.workbook.materialsInfinite}
                  </label>
                  <label className="flex items-center gap-2">
                    {t.workbook.materialsCount}
                    <input
                      type="number"
                      value={materialCount}
                      onChange={(event) => setMaterialCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                      className="w-16 rounded-full border border-ink/20 bg-paper px-2 py-1 text-xs"
                      min={1}
                      max={50}
                    />
                  </label>
                </div>
              </div>
            ) : settingsOpen === "match" ? (
              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.settings.focus}</span>
                  <button
                    onClick={() => setMatchFocusOnStart((prev) => !prev)}
                    className="rounded-full border border-ink/10 bg-paper px-3 py-1"
                  >
                    {matchFocusOnStart ? t.workbook.settings.on : t.workbook.settings.off}
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <span>{t.workbook.matchAutoTitle}</span>
                  <button
                    onClick={() => setMatchAutoPreferred((prev) => !prev)}
                    className="rounded-full border border-ink/10 bg-paper px-3 py-1"
                  >
                    {matchAutoPreferred ? t.workbook.settings.on : t.workbook.settings.off}
                  </button>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">
                    {t.workbook.matchAutoTypesLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeOptions.map((option) => {
                      const active = matchAutoTypes.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            setMatchAutoTypes((prev) =>
                              prev.includes(option.id)
                                ? prev.filter((item) => item !== option.id)
                                : [...prev, option.id]
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            active ? "border-ink bg-ink/5" : "border-ink/10 bg-paper/80"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialRandom}
                      onChange={(event) => setMaterialRandom(event.target.checked)}
                    />
                    {t.workbook.materialsRandom}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialInfinite}
                      onChange={(event) => setMaterialInfinite(event.target.checked)}
                    />
                    {t.workbook.materialsInfinite}
                  </label>
                  <label className="flex items-center gap-2">
                    {t.workbook.materialsCount}
                    <input
                      type="number"
                      value={materialCount}
                      onChange={(event) => setMaterialCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                      className="w-16 rounded-full border border-ink/20 bg-paper px-2 py-1 text-xs"
                      min={1}
                      max={50}
                    />
                  </label>
                </div>
                <button
                  onClick={async () => {
                    if (matchAutoPreferred) {
                      await loadMatchAuto();
                    } else {
                      setMaterialsOpen(true);
                    }
                    setSettingsOpen(null);
                  }}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {t.workbook.materialStart}
                </button>
              </div>
            ) : settingsOpen === "paraphrase" || settingsOpen === "story" || settingsOpen === "translate" ? (
              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialRandom}
                      onChange={(event) => setMaterialRandom(event.target.checked)}
                    />
                    {t.workbook.materialsRandom}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialInfinite}
                      onChange={(event) => setMaterialInfinite(event.target.checked)}
                    />
                    {t.workbook.materialsInfinite}
                  </label>
                  <label className="flex items-center gap-2">
                    {t.workbook.materialsCount}
                    <input
                      type="number"
                      value={materialCount}
                      onChange={(event) => setMaterialCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                      className="w-16 rounded-full border border-ink/20 bg-paper px-2 py-1 text-xs"
                      min={1}
                      max={50}
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    setMaterialsOpen(true);
                    setSettingsOpen(null);
                  }}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {t.workbook.materialsButton}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-4 text-sm text-ink/60">
                <p className="font-semibold text-ink">{t.workbook.comingSoonTitle}</p>
                <p className="mt-2 text-sm text-ink/60">{t.workbook.comingSoonText}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {clozeFocusId && activeCloze && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.clozeTitle}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{activeCloze.title || t.workbook.contentUntitled}</h3>
                </div>
                <button
                  onClick={() => setClozeFocusId(null)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-xs"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {(activeCloze.content?.items || []).map((item: any, idx: number) => {
                const parts = String(item.text || "").split("___");
                const itemKeyBase = item.id || idx;
                return (
                  <div key={itemKeyBase} className="rounded-2xl border border-ink/10 bg-paper px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                      {t.workbook.clozeItem} {idx + 1}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink/80">
                      {parts.map((part: string, partIndex: number) => {
                        const gapIndex = partIndex;
                        const gap = item.gaps?.[gapIndex];
                        if (!gap) return <span key={`${itemKeyBase}-p-${partIndex}`}>{part}</span>;
                        const key = `${itemKeyBase}-${gapIndex}`;
                        const value = clozeAnswers[key] || "";
                        const correct = isGapCorrect(gap, value);
                        return (
                          <span key={`${itemKeyBase}-g-${partIndex}`} className="inline-flex items-center gap-2">
                            <span>{part}</span>
                            <input
                              value={value}
                              onChange={(event) =>
                                setClozeAnswers((prev) => ({ ...prev, [key]: event.target.value }))
                              }
                              className={`w-40 rounded-full border px-3 py-1 text-sm ${
                                !value
                                  ? "border-ink/20 bg-paper"
                                  : correct
                                    ? "border-moss/40 bg-moss/10"
                                    : "border-terracotta/40 bg-terracotta/10"
                              }`}
                              placeholder={t.workbook.clozePlaceholder}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5 text-xs">
              <button
                onClick={() => setClozeFocusId(null)}
                className="rounded-full border border-ink/20 px-4 py-2"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
      {matchFocusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchTitle}</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {activeMatch?.title || t.workbook.contentUntitled}
                  </h3>
                  {matchAutoEnabled && <p className="mt-2 text-xs text-moss">{t.workbook.matchAutoActive}</p>}
                </div>
                <button
                  onClick={() => setMatchFocusOpen(false)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-xs"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {activeMatch ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchLeft}</p>
                    {matchLeft.map((item) => {
                      const matched = matchMatched[item];
                      const isActive = matchSelectedLeft === item;
                      return (
                        <button
                          key={item}
                          onClick={() => setMatchSelectedLeft(item)}
                          className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition ${
                            matched
                              ? "border-moss/30 bg-moss/10 text-moss"
                              : isActive
                                ? "border-ink bg-ink/5"
                                : "border-ink/10 bg-paper/70 hover:border-ink/30"
                          }`}
                          disabled={Boolean(matched)}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.matchRight}</p>
                    {matchRight.map((item) => {
                      const matched = Object.values(matchMatched).includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => {
                            if (!matchSelectedLeft || matched) return;
                            const pair = activeMatch?.content?.pairs?.find((p: any) => p.left === matchSelectedLeft);
                            const correct = pair?.right === item;
                            if (correct) {
                              setMatchMatched((prev) => ({ ...prev, [matchSelectedLeft]: item }));
                            }
                            setMatchSelectedLeft(null);
                            if (activeMatch) {
                              const total = (activeMatch.content?.pairs || []).length || 0;
                              const correctCount = Object.keys({
                                ...matchMatched,
                                ...(correct ? { [matchSelectedLeft]: item } : {})
                              }).length;
                              setMatchScore(total === 0 ? 0 : correctCount / total);
                            }
                          }}
                          className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition ${
                            matched
                              ? "border-moss/30 bg-moss/10 text-moss"
                              : "border-ink/10 bg-paper/70 hover:border-ink/30"
                          }`}
                          disabled={matched}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink/60">{t.workbook.materialEmpty}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5 text-xs">
              <span className="text-xs text-ink/60">
                {t.workbook.matchProgress} {Object.keys(matchMatched).length} / {matchLeft.length}
              </span>
              {matchPoints !== null && (
                <span className="text-xs text-moss">+{matchPoints} {t.workbook.points}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {matchResultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.workbook.matchResultTitle}</h3>
              <button
                onClick={() => setMatchResultOpen(false)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs"
              >
                {t.common.close}
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-ink/70">
              <p>
                {t.workbook.matchResultScore} {Math.round((matchScore || 0) * 100)}%
              </p>
              <p>
                {t.workbook.matchResultCorrect} {Object.keys(matchMatched).length} / {matchLeft.length}
              </p>
              <p>
                {t.workbook.matchResultWrong} {Math.max(0, matchLeft.length - Object.keys(matchMatched).length)}
              </p>
              {matchPoints !== null && (
                <p className="text-moss">+{matchPoints} {t.workbook.points}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMatchResultOpen(false)}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
              >
                {t.workbook.matchResultDone}
              </button>
            </div>
          </div>
        </div>
      )}
      {materialsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.materialsTitle}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{t.workbook.materialsSubtitle}</h3>
                </div>
                <button
                  onClick={() => setMaterialsOpen(false)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-xs"
                >
                  {t.common.close}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1">
                  <input
                    type="checkbox"
                    checked={materialRandom}
                    onChange={(event) => setMaterialRandom(event.target.checked)}
                  />
                  {t.workbook.materialsRandom}
                </label>
                <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1">
                  <input
                    type="checkbox"
                    checked={materialInfinite}
                    onChange={(event) => setMaterialInfinite(event.target.checked)}
                  />
                  {t.workbook.materialsInfinite}
                </label>
                <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.workbook.materialsCount}
                  <input
                    type="number"
                    value={materialCount}
                    onChange={(event) => setMaterialCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                    className="w-16 rounded-full border border-ink/20 bg-paper px-2 py-1 text-xs"
                    min={1}
                    max={50}
                  />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              {activeExercise === "cloze" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {clozeMaterials.map((item) => {
                    const done = (seenMaterials.cloze || []).includes(item._id);
                    return (
                      <button
                        key={item._id}
                        onClick={() => {
                          setActiveClozeId(item._id);
                          setClozeAnswers({});
                          setClozeChecked(false);
                          setClozeScore(null);
                          setClozePoints(null);
                          setClozeAwarded(false);
                          setClozeTrainingActive(false);
                          setClozeQueue([]);
                          setClozeQueueIndex(0);
                          setMaterialsOpen(false);
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm shadow-soft transition ${
                          activeClozeId === item._id
                            ? "border-ink bg-ink/5"
                            : "border-ink/10 bg-paper/80 hover:border-ink/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                            <p className="mt-1 text-xs text-ink/50">{item.level || "A1"}</p>
                          </div>
                          {done && (
                            <span className="rounded-full bg-moss/20 px-3 py-1 text-[10px] font-semibold text-moss">
                              {t.workbook.materialDone}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {clozeMaterials.length === 0 && (
                    <p className="text-sm text-ink/60">{t.workbook.materialEmpty}</p>
                  )}
                </div>
              ) : activeExercise === "match" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-ink/20 bg-paper/70 px-4 py-4 text-left text-sm">
                    <p className="text-sm font-semibold">{t.workbook.matchAutoTitle}</p>
                    <p className="mt-1 text-xs text-ink/50">{t.workbook.matchAutoHint}</p>
                    <div className="mt-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">
                        {t.workbook.matchAutoTypesLabel}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {typeOptions.map((option) => {
                          const active = matchAutoTypes.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              onClick={() =>
                                setMatchAutoTypes((prev) =>
                                  prev.includes(option.id)
                                    ? prev.filter((item) => item !== option.id)
                                    : [...prev, option.id]
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-[11px] ${
                                active ? "border-ink bg-ink/5" : "border-ink/10 bg-paper/80"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {matchAutoLastUsed && (
                      <p className="mt-3 text-[11px] text-ink/50">
                        {t.workbook.matchAutoLastUsed}{" "}
                        {new Date(matchAutoLastUsed).toLocaleString()}
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        await loadMatchAuto();
                        setMaterialsOpen(false);
                      }}
                      className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                      disabled={matchAutoLoading}
                    >
                      {matchAutoLoading ? t.workbook.matchAutoLoading : t.workbook.matchAutoButton}
                    </button>
                  </div>
                  {matchMaterials.map((item) => {
                    const done = (seenMaterials.match || []).includes(item._id);
                    return (
                      <button
                        key={item._id}
                        onClick={() => {
                          setActiveMatchId(item._id);
                          initMatch(item);
                          setMatchQueue([]);
                          setMatchQueueIndex(0);
                          setMatchTrainingActive(false);
                          setMatchAutoEnabled(false);
                          setMatchAutoMaterial(null);
                          if (matchFocusOnStart) {
                            setMatchFocusOpen(true);
                          }
                          setMaterialsOpen(false);
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm shadow-soft transition ${
                          activeMatchId === item._id
                            ? "border-ink bg-ink/5"
                            : "border-ink/10 bg-paper/80 hover:border-ink/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                            <p className="mt-1 text-xs text-ink/50">{item.level || "A1"}</p>
                          </div>
                          {done && (
                            <span className="rounded-full bg-moss/20 px-3 py-1 text-[10px] font-semibold text-moss">
                              {t.workbook.materialDone}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {contentItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => {
                        setActiveContentId(item._id);
                        setMaterialsOpen(false);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm shadow-soft transition ${
                        activeContentId === item._id
                          ? "border-ink bg-ink/5"
                          : "border-ink/10 bg-paper/80 hover:border-ink/30"
                      }`}
                    >
                      <p className="font-semibold">{item.title || t.workbook.contentUntitled}</p>
                      <p className="mt-1 text-xs text-ink/50">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5 text-xs">
              <div className="text-ink/50">{t.workbook.materialsFooterNote}</div>
              <button
                onClick={() => {
                  const isCloze = activeExercise === "cloze";
                  const isMatch = activeExercise === "match";
                  if (!isCloze && !isMatch) return;
                  const materials = isCloze ? clozeMaterials : matchMaterials;
                  const seenKey = isCloze ? "cloze" : "match";
                  const pool = (materialInfinite
                    ? materials
                    : materials.filter((item) => !(seenMaterials[seenKey] || []).includes(item._id))).map((item) => item._id);
                  const source = pool.length > 0 ? pool : materials.map((item) => item._id);
                  if (source.length === 0) return;
                  let nextQueue = source;
                  if (materialRandom) {
                    nextQueue = [...source].sort(() => Math.random() - 0.5);
                  }
                  nextQueue = nextQueue.slice(0, Math.max(1, materialCount));
                  if (isCloze) {
                    setClozeQueue(nextQueue);
                    setClozeQueueIndex(0);
                    setClozeTrainingActive(true);
                    setActiveClozeId(nextQueue[0]);
                    setClozeAnswers({});
                    setClozeChecked(false);
                    setClozeScore(null);
                    setClozePoints(null);
                    setClozeAwarded(false);
                    if (clozeFocusOnStart) {
                      setClozeFocusId(nextQueue[0]);
                    }
                  } else if (isMatch) {
                    setMatchAutoEnabled(false);
                    setMatchAutoMaterial(null);
                    setMatchQueue(nextQueue);
                    setMatchQueueIndex(0);
                    setMatchTrainingActive(true);
                    setActiveMatchId(nextQueue[0]);
                    const nextMaterial = matchMaterials.find((item) => item._id === nextQueue[0]);
                    initMatch(nextMaterial);
                    setMatchAwarded(false);
                    setMatchPoints(null);
                    if (matchFocusOnStart) {
                      setMatchFocusOpen(true);
                    }
                  }
                  setMaterialsOpen(false);
                }}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
              >
                {t.workbook.materialStart}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
