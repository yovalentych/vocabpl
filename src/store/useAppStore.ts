"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeckType = "verbs" | "adverbs" | "adjectives" | "test";

type AppState = {
  deckType: DeckType;
  dailyGoal: number;
  displayMode: "pl-to-uk" | "uk-to-pl";
  setDeckType: (deckType: DeckType) => void;
  setDailyGoal: (goal: number) => void;
  setDisplayMode: (mode: "pl-to-uk" | "uk-to-pl") => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      deckType: "verbs",
      dailyGoal: 20,
      displayMode: "pl-to-uk",
      setDeckType: (deckType) => set({ deckType }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setDisplayMode: (displayMode) => set({ displayMode })
    }),
    {
      name: "polish-vocab-settings"
    }
  )
);
