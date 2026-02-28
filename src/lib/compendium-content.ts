export interface CompendiumSprint {
  id: string;
  titleUk: string;
  titlePl: string;
  descriptionUk?: string;
  descriptionPl?: string;
  hintUk?: string;
  hintPl?: string;
  detailedUk?: string;
  detailedPl?: string;
  commonMistakesUk?: string[];
  commonMistakesPl?: string[];
  counterExamplesUk?: string[];
  counterExamplesPl?: string[];
  tipsUk?: string;
  tipsPl?: string;
  mnemonicUk?: string;
  mnemonicPl?: string;
  difficulty?: string;
  estimatedMinutes?: number;
}

export interface CompendiumRule {
  id: string;
  titleUk: string;
  titlePl: string;
  contentUk?: string;
  contentPl?: string;
  bodyUk?: string;
  bodyPl?: string;
  detailedUk?: string;
  detailedPl?: string;
  commonMistakesUk?: string[];
  commonMistakesPl?: string[];
  counterExamplesUk?: string[];
  counterExamplesPl?: string[];
  tipsUk?: string;
  tipsPl?: string;
  mnemonicUk?: string;
  mnemonicPl?: string;
  difficulty?: string;
}

export interface CompendiumContent {
  grammar: {
    hero: {
      titleUk: string;
      titlePl: string;
      subtitleUk: string;
      subtitlePl: string;
      leadUk?: string;
      leadPl?: string;
    };
    sidebarNoteUk?: string;
    sidebarNotePl?: string;
    sidebarPlanUk?: string;
    sidebarPlanPl?: string;
    sprints: CompendiumSprint[];
    rules: CompendiumRule[];
  };
  usefulSites: {
    hero: {
      titleUk: string;
      titlePl: string;
      subtitleUk: string;
      subtitlePl: string;
      leadUk?: string;
      leadPl?: string;
    };
    sidebarNoteUk?: string;
    sidebarNotePl?: string;
    sidebarPlanUk?: string;
    sidebarPlanPl?: string;
    groups: Array<{
      id: string;
      titleUk: string;
      titlePl: string;
      items: Array<{
        id: string;
        name?: string;
        titleUk?: string;
        titlePl?: string;
        url: string;
        noteUk?: string;
        notePl?: string;
        descriptionUk?: string;
        descriptionPl?: string;
      }>;
    }>;
  };
  facts: {
    hero: {
      titleUk: string;
      titlePl: string;
      subtitleUk: string;
      subtitlePl: string;
      leadUk?: string;
      leadPl?: string;
    };
    sidebarNoteUk?: string;
    sidebarNotePl?: string;
    sidebarPlanUk?: string;
    sidebarPlanPl?: string;
    items: Array<{
      id: string;
      titleUk: string;
      titlePl: string;
      contentUk?: string;
      contentPl?: string;
      bodyUk?: string;
      bodyPl?: string;
      sourceLabel?: string;
      sourceUrl?: string;
    }>;
  };
  culture: {
    hero: {
      titleUk: string;
      titlePl: string;
      subtitleUk: string;
      subtitlePl: string;
      leadUk?: string;
      leadPl?: string;
    };
    sidebarNoteUk?: string;
    sidebarNotePl?: string;
    sidebarPlanUk?: string;
    sidebarPlanPl?: string;
    pulses: Array<{
      id: string;
      titleUk: string;
      titlePl: string;
      contentUk?: string;
      contentPl?: string;
      bodyUk?: string;
      bodyPl?: string;
      sourceLabel?: string;
      sourceUrl?: string;
    }>;
  };
}

export const defaultCompendiumContent: CompendiumContent = {
  grammar: {
    hero: {
      titleUk: "Граматика",
      titlePl: "Gramatyka",
      subtitleUk: "Правила польської мови",
      subtitlePl: "Zasady języka polskiego",
      leadUk: "",
      leadPl: ""
    },
    sidebarNoteUk: "",
    sidebarNotePl: "",
    sidebarPlanUk: "",
    sidebarPlanPl: "",
    sprints: [],
    rules: []
  },
  usefulSites: {
    hero: {
      titleUk: "Корисні сайти",
      titlePl: "Przydatne strony",
      subtitleUk: "Ресурси для вивчення польської",
      subtitlePl: "Zasoby do nauki języka polskiego",
      leadUk: "",
      leadPl: ""
    },
    sidebarNoteUk: "",
    sidebarNotePl: "",
    sidebarPlanUk: "",
    sidebarPlanPl: "",
    groups: []
  },
  facts: {
    hero: {
      titleUk: "Цікаві факти",
      titlePl: "Ciekawe fakty",
      subtitleUk: "Про Польщу та польську мову",
      subtitlePl: "O Polsce i języku polskim",
      leadUk: "",
      leadPl: ""
    },
    sidebarNoteUk: "",
    sidebarNotePl: "",
    sidebarPlanUk: "",
    sidebarPlanPl: "",
    items: []
  },
  culture: {
    hero: {
      titleUk: "Культура",
      titlePl: "Kultura",
      subtitleUk: "Польська культура та традиції",
      subtitlePl: "Polska kultura i tradycje",
      leadUk: "",
      leadPl: ""
    },
    sidebarNoteUk: "",
    sidebarNotePl: "",
    sidebarPlanUk: "",
    sidebarPlanPl: "",
    pulses: []
  }
};
