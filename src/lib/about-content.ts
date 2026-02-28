export interface AboutSection {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
  enabled: boolean;
  accent?: string;
}

export interface AboutContent {
  hero: {
    titleUk: string;
    titlePl: string;
    subtitleUk: string;
    subtitlePl: string;
    leadUk: string;
    leadPl: string;
    noteUk: string;
    notePl: string;
  };
  sections: AboutSection[];
  cta: {
    titleUk: string;
    titlePl: string;
    bodyUk: string;
    bodyPl: string;
    email: string;
  };
}

export const defaultAboutContent: AboutContent = {
  hero: {
    titleUk: "Про проект",
    titlePl: "O projekcie",
    subtitleUk: "Polish Vocab Studio - ваш персональний помічник у вивченні польської мови",
    subtitlePl: "Polish Vocab Studio - Twój osobisty asystent w nauce języka polskiego",
    leadUk: "Зробити вивчення польської мови доступним, ефективним та цікавим для всіх українців",
    leadPl: "Uczynić naukę języka polskiego dostępną, efektywną i interesującą dla wszystkich Ukraińców",
    noteUk: "Інтерактивні вправи та AI-перевірка",
    notePl: "Interaktywne ćwiczenia i sprawdzanie AI"
  },
  sections: [
    {
      id: "mission",
      titleUk: "Наша місія",
      titlePl: "Nasza misja",
      bodyUk: "Зробити вивчення польської мови доступним, ефективним та цікавим для всіх українців",
      bodyPl: "Uczynić naukę języka polskiego dostępną, efektywną i interesującą dla wszystkich Ukraińców",
      enabled: true,
      accent: "moss"
    },
    {
      id: "offer",
      titleUk: "Що ми пропонуємо",
      titlePl: "Co oferujemy",
      bodyUk: "Інтерактивні вправи, AI-перевірка, персоналізований підхід та багато іншого",
      bodyPl: "Interaktywne ćwiczenia, sprawdzanie AI, spersonalizowane podejście i wiele więcej",
      enabled: true,
      accent: "terracotta"
    }
  ],
  cta: {
    titleUk: "Зв'яжіться з нами",
    titlePl: "Skontaktuj się z nami",
    bodyUk: "Маєте питання або пропозиції? Напишіть нам!",
    bodyPl: "Masz pytania lub sugestie? Napisz do nas!",
    email: "contact@polishvocabstudio.com"
  }
};
