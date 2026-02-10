import type { Word } from "@/lib/types";

// Exercise types
export type ExerciseType =
  | "sentences"
  | "cloze"
  | "match"
  | "translate"
  | "dialogue"
  | "paraphrase"
  | "story"
  | "describe"
  | "video";

// Wizard steps
export type WizardStep = "selection" | "configuration" | "practice";

// Material structure (for cloze, match, paraphrase, story)
export interface Material {
  _id: string;
  title?: string;
  level: string;
  type: string;
  content: any;
  createdAt?: string;
}

// Workbook word with sentences
export type WorkbookWord = Word & {
  sentences: string[];
};

// Entry structure for history
export interface Entry {
  id: string;
  number: number;
  createdAt: string;
  items: {
    pl: string;
    uk: string;
    text: string;
    sentenceCount: number;
    points: number;
  }[];
  totalPoints: number;
  formattedText: string;
}

// Submission structure
export interface Submission {
  id: string;
  entryId: string;
  status: "pending" | "reviewed";
  comment?: string;
  rating?: number;
  createdAt: string;
}

// Exercise-specific states

export interface SentencesState {
  selectedTypes: string[];
  includeFavorites: boolean;
  includeMyWords: boolean;
  count: number;
  items: WorkbookWord[];
  activeId: string | null;
  isLoading: boolean;
  locked: boolean;
  quickStart?: boolean;
  checkLoading?: boolean;
  checkResult?: any | null;
}

export interface ClozeState {
  materials: Material[];
  activeMaterialId: string | null;
  answers: Record<string, string>;
  checked: boolean;
  score: number | null;
  points: number | null;
  hintsOpen: Record<string, boolean>;
  trainingMode: {
    active: boolean;
    queue: string[];
    index: number;
    random: boolean;
    infinite: boolean;
    count: number;
  };
  settings: {
    showHintsDefault: boolean;
    focusOnStart: boolean;
  };
  focusId: string | null;
  awarded: boolean;
  seenMaterials: string[];
}

export interface MatchState {
  materials: Material[];
  activeMaterialId: string | null;
  left: string[];
  right: string[];
  selectedLeft: string | null;
  matched: Record<string, string>;
  score: number | null;
  points: number | null;
  awarded: boolean;
  trainingMode: {
    active: boolean;
    queue: string[];
    index: number;
    random: boolean;
    infinite: boolean;
    count: number;
  };
  autoMode: {
    enabled: boolean;
    loading: boolean;
    material: Material | null;
    types: string[];
    lastUsed: string | null;
    preferred: boolean;
  };
  focusOpen: boolean;
  focusOnStart: boolean;
  resultOpen: boolean;
  seenMaterials: string[];
}

export interface TranslateState {
  direction: "uk_to_pl" | "pl_to_uk";
  count: number;
  prompt: string;
  useVocab: boolean;
  task: {
    id: string;
    level: string;
    direction: "uk_to_pl" | "pl_to_pk";
    topic: string;
    items: {
      id: string;
      source: string;
      hints?: string | null;
      targetVocab?: string[];
    }[];
  } | null;
  answers: Record<string, string>;
  result: any | null;
  loading: boolean;
  vocabStatus: Record<string, "idle" | "saving" | "done" | "error">;
  bulkLoading: boolean;
}

export interface DialogueState {
  mode: "ai" | "static";
  startBy: "user" | "ai";
  scenario?: string;
  pack: any | null;
  activeId: string | null;
  roleplay: { role: "user" | "ai"; text: string }[];
  input: string;
  loading: boolean;
  feedback: any | null;
  suggestedStatus: Record<string, "idle" | "saving" | "done" | "error">;
  staticDialogs: any[];
  map: Record<string, string[]>;
}

export interface ParaphraseState {
  materials: Material[];
  activeId: string | null;
  mode: "ai" | "static";
  topic: string;
  generateCount: number;
  task: any | null;
  answers: Record<string, string>;
  result: any | null;
  loading: boolean;
  suggestedStatus: Record<string, "idle" | "saving" | "done" | "error">;
  warning: string | null;
  focusOpen: boolean;
  focusIndex: number;
  awardedPoints: number | null;
}

export interface StoryState {
  contentItems: Material[];
  activeContentId: string | null;
  isLoading: boolean;
}

export interface DescribeState {
  prompt: string;
  level: "A1" | "A2" | "B1" | "B2";
  image: {
    url: string;
    thumb?: string;
    alt?: string | null;
    author?: string | null;
    authorUrl?: string | null;
    sourceUrl?: string | null;
  } | null;
  description: string;
  result: any | null;
  loading: boolean;
  vocabStatus: Record<string, "idle" | "saving" | "done" | "error">;
}

export interface HistoryState {
  entries: Entry[];
  submissions: Submission[];
  expandedEntryId: string | null;
  submitStatus: Record<string, "idle" | "saving" | "done" | "error">;
  isLoading: boolean;
}

// Main workbook state
export interface WorkbookState {
  // Wizard flow
  wizardStep: WizardStep;
  selectedExerciseType: ExerciseType | null;

  // Common state
  isLoading: boolean;
  errorMessage: string | null;
  showHistory: boolean;

  // AI state (shared across AI exercises)
  ai: {
    enabled: Record<string, boolean>;
    topics: Record<string, string>;
    prompts: Record<string, { title?: string; prompt: string } | null>;
    status: Record<string, "idle" | "loading" | "error">;
    message: string | null;
  };

  // Exercise-specific states
  exercises: {
    sentences: SentencesState;
    cloze: ClozeState;
    match: MatchState;
    translate: TranslateState;
    dialogue: DialogueState;
    paraphrase: ParaphraseState;
    story: StoryState;
    describe: DescribeState;
  };

  // History
  history: HistoryState;
}

// Reducer actions
export type WorkbookAction =
  | { type: "SELECT_EXERCISE"; payload: ExerciseType }
  | { type: "GO_TO_CONFIG" }
  | { type: "GO_TO_PRACTICE"; payload?: any }
  | { type: "RESET_WIZARD" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "TOGGLE_HISTORY"; payload?: boolean }
  | {
      type: "UPDATE_EXERCISE_STATE";
      exercise: ExerciseType;
      payload: Partial<any>;
    }
  | { type: "UPDATE_AI_STATE"; payload: Partial<WorkbookState["ai"]> }
  | { type: "SET_AI_TOPIC"; exercise: ExerciseType; topic: string }
  | { type: "SET_AI_STATUS"; exercise: ExerciseType; status: "idle" | "loading" | "error" }
  | { type: "SET_AI_PROMPT"; exercise: ExerciseType; prompt: { title?: string; prompt: string } | null }
  | { type: "SET_AI_MESSAGE"; message: string | null }
  | { type: "TOGGLE_AI"; exercise: ExerciseType }
  | { type: "UPDATE_HISTORY_STATE"; payload: Partial<HistoryState> };

// Initial states
export const initialSentencesState: SentencesState = {
  selectedTypes: [
    "verbs",
    "adverbs",
    "adjectives",
    "slang",
    "others",
    "soft_swears",
    "clean_emotions",
    "abbreviations"
  ],
  includeFavorites: true,
  includeMyWords: true,
  count: 5,
  items: [],
  activeId: null,
  isLoading: false,
  locked: false,
  checkLoading: false,
  checkResult: null
};

export const initialClozeState: ClozeState = {
  materials: [],
  activeMaterialId: null,
  answers: {},
  checked: false,
  score: null,
  points: null,
  hintsOpen: {},
  trainingMode: {
    active: false,
    queue: [],
    index: 0,
    random: false,
    infinite: false,
    count: 5
  },
  settings: {
    showHintsDefault: true,
    focusOnStart: false
  },
  focusId: null,
  awarded: false,
  seenMaterials: []
};

export const initialMatchState: MatchState = {
  materials: [],
  activeMaterialId: null,
  left: [],
  right: [],
  selectedLeft: null,
  matched: {},
  score: null,
  points: null,
  awarded: false,
  trainingMode: {
    active: false,
    queue: [],
    index: 0,
    random: false,
    infinite: false,
    count: 5
  },
  autoMode: {
    enabled: false,
    loading: false,
    material: null,
    types: ["verbs", "adverbs", "adjectives"],
    lastUsed: null,
    preferred: false
  },
  focusOpen: false,
  focusOnStart: false,
  resultOpen: false,
  seenMaterials: []
};

export const initialTranslateState: TranslateState = {
  direction: "uk_to_pl",
  count: 6,
  prompt: "",
  useVocab: true,
  task: null,
  answers: {},
  result: null,
  loading: false,
  vocabStatus: {},
  bulkLoading: false
};

export const initialDialogueState: DialogueState = {
  mode: "ai",
  startBy: "ai",
  pack: null,
  activeId: null,
  roleplay: [],
  input: "",
  loading: false,
  feedback: null,
  suggestedStatus: {},
  staticDialogs: [],
  map: {}
};

export const initialParaphraseState: ParaphraseState = {
  materials: [],
  activeId: null,
  mode: "ai",
  topic: "",
  generateCount: 5,
  task: null,
  answers: {},
  result: null,
  loading: false,
  suggestedStatus: {},
  warning: null,
  focusOpen: false,
  focusIndex: 0,
  awardedPoints: null
};

export const initialStoryState: StoryState = {
  contentItems: [],
  activeContentId: null,
  isLoading: false
};

export const initialDescribeState: DescribeState = {
  prompt: "",
  level: "A1",
  image: null,
  description: "",
  result: null,
  loading: false,
  vocabStatus: {}
};

export const initialHistoryState: HistoryState = {
  entries: [],
  submissions: [],
  expandedEntryId: null,
  submitStatus: {},
  isLoading: false
};
