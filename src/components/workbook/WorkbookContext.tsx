"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

// Stub context for backward compatibility
// Will be gradually removed as components are refactored

export type ExerciseType =
  | "sentences"
  | "cloze"
  | "match"
  | "translate"
  | "dialogue"
  | "paraphrase"
  | "story"
  | "describe";

interface WorkbookState {
  wizardStep: "selection" | "configuration" | "practice";
  selectedExerciseType: ExerciseType | null;
  exercises: Record<string, any>;
  showHistory: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  ai?: any; // AI state for prompts and generation
}

type WorkbookAction =
  | { type: "SELECT_EXERCISE"; payload: ExerciseType }
  | { type: "GO_TO_CONFIGURATION" }
  | { type: "GO_TO_CONFIG" }
  | { type: "GO_TO_PRACTICE" }
  | { type: "RESET_WIZARD" }
  | { type: "TOGGLE_HISTORY" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_EXERCISE_CONFIG"; payload: { type: ExerciseType; config: any } }
  | { type: "UPDATE_EXERCISE_STATE"; exercise: string; payload: any }
  | { type: string; [key: string]: any }; // Catch-all for any other action types

const initialState: WorkbookState = {
  wizardStep: "selection",
  selectedExerciseType: null,
  exercises: {},
  showHistory: false,
  isLoading: false,
  errorMessage: null,
  ai: {
    enabled: {},
    topics: {},
    prompts: {},
    status: {},
    message: null
  }
};

function workbookReducer(state: WorkbookState, action: WorkbookAction): WorkbookState {
  switch (action.type) {
    case "SELECT_EXERCISE":
      return { ...state, selectedExerciseType: action.payload, wizardStep: "configuration" };
    case "GO_TO_CONFIGURATION":
    case "GO_TO_CONFIG":
      return { ...state, wizardStep: "configuration" };
    case "GO_TO_PRACTICE":
      return { ...state, wizardStep: "practice" };
    case "RESET_WIZARD":
      return { ...initialState };
    case "TOGGLE_HISTORY":
      return { ...state, showHistory: !state.showHistory };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, errorMessage: action.payload };
    case "UPDATE_EXERCISE_CONFIG":
      return {
        ...state,
        exercises: {
          ...state.exercises,
          [action.payload.type]: action.payload.config
        }
      };
    case "UPDATE_EXERCISE_STATE":
      return {
        ...state,
        exercises: {
          ...state.exercises,
          [(action as any).exercise]: {
            ...(state.exercises[(action as any).exercise] || {}),
            ...(action as any).payload
          }
        }
      };
    case "SET_AI_TOPIC":
      return {
        ...state,
        ai: {
          ...state.ai,
          topics: {
            ...state.ai?.topics,
            [(action as any).exercise]: (action as any).topic
          }
        }
      };
    case "SET_AI_STATUS":
      return {
        ...state,
        ai: {
          ...state.ai,
          status: {
            ...state.ai?.status,
            [(action as any).exercise]: (action as any).status
          }
        }
      };
    case "SET_AI_PROMPT":
      return {
        ...state,
        ai: {
          ...state.ai,
          prompts: {
            ...state.ai?.prompts,
            [(action as any).exercise]: (action as any).prompt
          }
        }
      };
    case "SET_AI_MESSAGE":
      return {
        ...state,
        ai: {
          ...state.ai,
          message: (action as any).message
        }
      };
    case "TOGGLE_AI":
      return {
        ...state,
        ai: {
          ...state.ai,
          enabled: {
            ...state.ai?.enabled,
            [(action as any).exercise]: !state.ai?.enabled?.[(action as any).exercise]
          }
        }
      };
    default:
      return state;
  }
}

interface WorkbookContextType {
  state: WorkbookState;
  dispatch: React.Dispatch<WorkbookAction>;
}

const WorkbookContext = createContext<WorkbookContextType | undefined>(undefined);

export function WorkbookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workbookReducer, initialState);

  return (
    <WorkbookContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkbookContext.Provider>
  );
}

export function useWorkbookContext() {
  const context = useContext(WorkbookContext);
  if (!context) {
    throw new Error("useWorkbookContext must be used within WorkbookProvider");
  }
  return context;
}
