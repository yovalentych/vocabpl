export type AboutSection = {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
  enabled: boolean;
  accent?: "moss" | "terracotta" | "gold" | "ink";
};

export type AboutContent = {
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
  updatedAt?: string;
};

export const defaultAboutContent: AboutContent = {
  hero: {
    titleUk: "Про PVS",
    titlePl: "O PVS",
    subtitleUk: "Polish Vocab Studio — простір для глибокого, живого вивчення польської.",
    subtitlePl: "Polish Vocab Studio — przestrzeń do głębokiej, żywej nauki polskiego.",
    leadUk:
      "Це застосунок, який не диктує шлях, а запрошує досліджувати. Ти сам відкриваєш функції, збираєш свій стиль і рухаєшся у власному темпі.",
    leadPl:
      "To aplikacja, która nie narzuca ścieżki, lecz zaprasza do odkrywania. Sam tworzysz swój styl nauki i idziesz we własnym tempie.",
    noteUk:
      "AI‑вправи не зберігаються, щоб не накопичувати контент, до якого ми вже не повернемося 😄",
    notePl:
      "Ćwiczenia AI nie są zapisywane, by nie gromadzić treści, do których i tak nie wrócimy 😄"
  },
  sections: [
    {
      id: "philosophy",
      titleUk: "Філософія",
      titlePl: "Filozofia",
      bodyUk:
        "PVS побудований як дослідницький простір. Тут немає «єдиного правильного маршруту» — є ти, твої цілі і гнучкий набір інструментів.",
      bodyPl:
        "PVS jest zaprojektowany jako przestrzeń odkrywania. Nie ma jedynej poprawnej ścieżki — jesteś Ty, Twoje cele i zestaw elastycznych narzędzi.",
      enabled: true,
      accent: "moss"
    },
    {
      id: "modes",
      titleUk: "Два режими навчання",
      titlePl: "Dwa tryby nauki",
      bodyUk:
        "Класичний режим — контент від мене, структуровані вправи і перевірені пояснення. AI‑режим — генерація вправ під твій контекст, швидкі підказки та миттєва перевірка.",
      bodyPl:
        "Tryb klasyczny — mój autorski content, ułożone ćwiczenia i sprawdzone wyjaśnienia. Tryb AI — generowanie zadań pod Twój kontekst, szybkie podpowiedzi i natychmiastowa weryfikacja.",
      enabled: true,
      accent: "terracotta"
    },
    {
      id: "why-polish",
      titleUk: "Чому саме польська",
      titlePl: "Dlaczego polski",
      bodyUk:
        "Я навчався у Польщі і пройшов шлях адаптації, навчання та мовних бар’єрів. Польська стала для мене не просто мовою, а інструментом свободи й освіти — і хочу поділитися цим досвідом.",
      bodyPl:
        "Studiowałem w Polsce i przeszedłem drogę adaptacji, nauki oraz barier językowych. Polski stał się dla mnie nie tylko językiem, lecz narzędziem wolności i edukacji — i chcę tym doświadczeniem się podzielić.",
      enabled: true,
      accent: "gold"
    },
    {
      id: "support",
      titleUk: "Підтримка проєкту",
      titlePl: "Wsparcie projektu",
      bodyUk:
        "Підтримуючи PVS, ви допомагаєте мені збирати кошти на наукові дослідження в інституті, де я готую дисертацію. В умовах війни та дуже обмеженого фінансування науки ця підтримка справді має значення.",
      bodyPl:
        "Wspierając PVS, pomagasz mi zbierać środki na badania naukowe w instytucie, gdzie przygotowuję dysertację. W warunkach wojny i bardzo ograniczonego finansowania nauki to wsparcie naprawdę ma znaczenie.",
      enabled: true,
      accent: "ink"
    },
    {
      id: "about-author",
      titleUk: "Про мене та мою роботу",
      titlePl: "O mnie i mojej pracy",
      bodyUk:
        "Я дослідник і викладач. Працюю над науковими темами, пов’язаними з мовою, навчанням і культурою, та готую дисертацію в аспірантурі.",
      bodyPl:
        "Jestem badaczem i wykładowcą. Pracuję nad tematami naukowymi związanymi z językiem, edukacją i kulturą oraz przygotowuję dysertację w ramach studiów doktoranckich.",
      enabled: true,
      accent: "moss"
    }
  ],
  cta: {
    titleUk: "Дякую за підтримку",
    titlePl: "Dziękuję za wsparcie",
    bodyUk:
      "Якщо хочеш підтримати проєкт або співпрацювати — напиши на пошту. Я відповім особисто.",
    bodyPl:
      "Jeśli chcesz wesprzeć projekt lub współpracować — napisz na mail. Odpowiem osobiście.",
    email: "info@vocabpl.uno"
  }
};
