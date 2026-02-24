export type CompendiumHero = {
  titleUk: string;
  titlePl: string;
  subtitleUk: string;
  subtitlePl: string;
  leadUk: string;
  leadPl: string;
};

export type CompendiumSprint = {
  id: string;
  titleUk: string;
  titlePl: string;
  hintUk: string;
  hintPl: string;
};

export type CompendiumRule = {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
};

export type CompendiumSiteItem = {
  id: string;
  name: string;
  url: string;
  noteUk: string;
  notePl: string;
};

export type CompendiumSiteGroup = {
  id: string;
  titleUk: string;
  titlePl: string;
  items: CompendiumSiteItem[];
};

export type CompendiumFact = {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type CompendiumPulse = {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
};

export type CompendiumContent = {
  grammar: {
    hero: CompendiumHero;
    sprints: CompendiumSprint[];
    rules: CompendiumRule[];
  };
  usefulSites: {
    hero: CompendiumHero;
    groups: CompendiumSiteGroup[];
    sidebarNoteUk: string;
    sidebarNotePl: string;
    sidebarPlanUk: string;
    sidebarPlanPl: string;
  };
  facts: {
    hero: CompendiumHero;
    items: CompendiumFact[];
    sidebarNoteUk: string;
    sidebarNotePl: string;
    sidebarPlanUk: string;
    sidebarPlanPl: string;
  };
  culture: {
    hero: CompendiumHero;
    pulses: CompendiumPulse[];
    sidebarNoteUk: string;
    sidebarNotePl: string;
    sidebarPlanUk: string;
    sidebarPlanPl: string;
  };
  updatedAt?: string;
};

export const defaultCompendiumContent: CompendiumContent = {
  grammar: {
    hero: {
      titleUk: "Структури в пульсі",
      titlePl: "Struktury w pigułce",
      subtitleUk: "Тематичні блоки, короткі правила та швидкі приклади для щоденної практики.",
      subtitlePl: "Bloki tematyczne, krótkie reguły i szybkie przykłady.",
      leadUk:
        "Формат: **спринти** + **короткі правила**. Кожен блок — це 2-3 головні ідеї й приклади, які легко повторити.",
      leadPl:
        "Format: **sprinty** + **krótkie reguły**. Każdy blok to 2-3 kluczowe idee z przykładami."
    },
    sprints: [
      {
        id: "cases",
        titleUk: "Відмінки",
        titlePl: "Przypadki",
        hintUk: "- **do** → родовий\n- **w/na** → місцевий\n- **przez** → знахідний",
        hintPl: "- **do** → dopełniacz\n- **w/na** → miejscownik\n- **przez** → biernik"
      },
      {
        id: "verbs",
        titleUk: "Дієслова",
        titlePl: "Czasowniki",
        hintUk: "Знайди пару **dokonany/niedokonany** і тримай її поруч у нотатках.",
        hintPl: "Znajdź parę **dokonany/niedokonany** i trzymaj ją pod ręką."
      },
      {
        id: "prepositions",
        titleUk: "Прийменники",
        titlePl: "Przyimki",
        hintUk: "Запамʼятовуй звʼязки: **do + G**, **na + B/M**, **z + N**.",
        hintPl: "Zapamiętuj połączenia: **do + D**, **na + B/M**, **z + N**."
      },
      {
        id: "order",
        titleUk: "Порядок слів",
        titlePl: "Szyk",
        hintUk: "Базово: **підмет → дієслово → обʼєкт**, але нове став ближче до кінця.",
        hintPl: "Bazowo: **podmiot → czasownik → dopełnienie**, nowe bliżej końca."
      },
      {
        id: "questions",
        titleUk: "Питання",
        titlePl: "Pytania",
        hintUk: "**czy** для загальних, **kto/co/gdzie** для конкретних.",
        hintPl: "**czy** dla ogólnych, **kto/co/gdzie** dla konkretnych."
      }
    ],
    rules: [
      {
        id: "present",
        titleUk: "Теперішній час",
        titlePl: "Czas teraźniejszy",
        bodyUk:
          "Найчастіші закінчення:\n- **-am/-em** (ja)\n- **-asz/-esz** (ty)\n- **-a/-e/-i** (on/ona/ono)",
        bodyPl:
          "Najczęstsze końcówki:\n- **-am/-em** (ja)\n- **-asz/-esz** (ty)\n- **-a/-e/-i** (on/ona/ono)"
      },
      {
        id: "past",
        titleUk: "Минулий час",
        titlePl: "Czas przeszły",
        bodyUk: "Форми залежать від роду: _zrobiłem_ / _zrobiłam_. У множині: _zrobiliśmy_.",
        bodyPl: "Formy zależą od rodzaju: _zrobiłem_ / _zrobiłam_. W liczbie mnogiej: _zrobiliśmy_."
      },
      {
        id: "cases-short",
        titleUk: "Коротко про відмінки",
        titlePl: "O przypadkach",
        bodyUk:
          "Швидка логіка:\n- **kogo? czego?** → родовий\n- **komu? czemu?** → давальний\n- **kogo? co?** → знахідний",
        bodyPl:
          "Szybka logika:\n- **kogo? czego?** → dopełniacz\n- **komu? czemu?** → celownik\n- **kogo? co?** → biernik"
      },
      {
        id: "negation",
        titleUk: "Заперечення",
        titlePl: "Negacja",
        bodyUk: "Після заперечення часто переходять у родовий: _nie mam czasu_.",
        bodyPl: "Po negacji często pojawia się dopełniacz: _nie mam czasu_."
      },
      {
        id: "aspect",
        titleUk: "Вид дієслів",
        titlePl: "Aspekt",
        bodyUk:
          "Пара прикладів:\n- **robić** (недокон.) → процес\n- **zrobić** (докон.) → результат",
        bodyPl:
          "Para przykładów:\n- **robić** (niedokon.) → proces\n- **zrobić** (dokon.) → rezultat"
      }
    ]
  },
  usefulSites: {
    hero: {
      titleUk: "Мапа ресурсів",
      titlePl: "Mapa zasobów",
      subtitleUk: "Перевірені сервіси для практики, словники й медіа.",
      subtitlePl: "Sprawdzone serwisy do praktyki.",
      leadUk:
        "Кожен ресурс має короткий опис і фокус. Додавай свої — коли наповнимо довідник власними підбірками.",
      leadPl: "Słowniki, treningi, podcasty i media — wszystko w jednym miejscu."
    },
    groups: [
      {
        id: "dict",
        titleUk: "Словники та переклад",
        titlePl: "Słowniki i tłumaczenie",
        items: [
          {
            id: "babla",
            name: "bab.la",
            url: "https://pl.bab.la",
            noteUk: "Відмінювання, приклади вживання, синоніми.",
            notePl: "Odmiana i przykłady użycia."
          },
          {
            id: "odmiana",
            name: "Odmiana.net",
            url: "https://odmiana.net",
            noteUk: "Форми іменників, прикметників і дієслів.",
            notePl: "Formy rzeczowników i przymiotników."
          }
        ]
      },
      {
        id: "practice",
        titleUk: "Практика",
        titlePl: "Praktyka",
        items: [
          {
            id: "clozemaster",
            name: "Clozemaster",
            url: "https://www.clozemaster.com",
            noteUk: "Контекстні речення + інтервальні повторення.",
            notePl: "Powtórki w kontekście zdań."
          },
          {
            id: "pod101",
            name: "PolishPod101",
            url: "https://www.polishpod101.com",
            noteUk: "Аудіо, відео та діалоги.",
            notePl: "Audio i wideo do ćwiczenia słuchu."
          }
        ]
      },
      {
        id: "grammar",
        titleUk: "Граматика",
        titlePl: "Gramatyka",
        items: [
          {
            id: "polski-grammar",
            name: "Poradnia PWN",
            url: "https://poradnia.pwn.pl",
            noteUk: "Короткі пояснення й приклади для самостійної роботи.",
            notePl: "Krótkie wyjaśnienia i przykłady."
          },
          {
            id: "uni-wroclaw",
            name: "SJP PWN",
            url: "https://sjp.pwn.pl",
            noteUk: "Словник і пояснення для глибшого розбору.",
            notePl: "Słownik i wyjaśnienia do głębszej analizy."
          }
        ]
      },
      {
        id: "media",
        titleUk: "Медіа",
        titlePl: "Media",
        items: [
          {
            id: "radio-nowy",
            name: "Radio Nowy Świat",
            url: "https://nowyswiat.online",
            noteUk: "Сучасні теми, природна мова.",
            notePl: "Współczesne tematy, naturalny język."
          },
          {
            id: "tvp-kultura",
            name: "TVP Kultura",
            url: "https://kultura.tvp.pl",
            noteUk: "Культурні програми і репортажі.",
            notePl: "Programy kulturalne i reportaże."
          }
        ]
      },
      {
        id: "community",
        titleUk: "Спільноти",
        titlePl: "Społeczności",
        items: [
          {
            id: "reddit-polish",
            name: "r/learnpolish",
            url: "https://www.reddit.com/r/learnpolish/",
            noteUk: "Питання, відповіді, реальні кейси.",
            notePl: "Pytania, odpowiedzi, realne кейси."
          }
        ]
      }
    ],
    sidebarNoteUk: "Тут зʼявиться сортування, теги та фільтри.\n- рівень складності\n- тип ресурсу\n- швидкі нотатки",
    sidebarNotePl: "Pojawi się sortowanie, tagi i filtry.",
    sidebarPlanUk: "План: категорії, оцінки, короткі примітки.\n- статус перевірки\n- рекомендований рівень",
    sidebarPlanPl: "Plan: kategorie, oceny, krótkie notatki."
  },
  facts: {
    hero: {
      titleUk: "Малі історії, що чіпляються",
      titlePl: "Małe historie, które zostają",
      subtitleUk: "Короткі факти про мову та культуру, які легко запамʼятати.",
      subtitlePl: "Krótkie fakty o języku i kulturze.",
      leadUk: "Читай по 1-2 факти щодня — і контекст стане знайомим.",
      leadPl: "1-2 fakty dziennie to szybki sposób na kontekst."
    },
    items: [
      {
        id: "fact-1",
        titleUk: "Шиплячі ряди",
        titlePl: "Rzędy syczące",
        bodyUk:
          "У польській є кілька серій шиплячих/свистячих. Вони змінюють значення слів, тому варто тренувати слух.",
        bodyPl: "S, sz, ś, cz, ż — różne serie dźwięków zmieniających znaczenie."
      },
      {
        id: "fact-2",
        titleUk: "Лексичні пастки",
        titlePl: "Fałszywi przyjaciele",
        bodyUk: "«Sklep» — магазин, «szkło» — скло. Такі слова часто плутають.",
        bodyPl: "«Sklep» to sklep, «szkło» to szkło. Kontekst jest kluczowy."
      },
      {
        id: "fact-3",
        titleUk: "Наголос",
        titlePl: "Akcent",
        bodyUk: "У більшості слів наголос падає на передостанній склад.",
        bodyPl: "W większości słów akcent pada na przedostatnią sylabę."
      },
      {
        id: "fact-4",
        titleUk: "Ł vs L",
        titlePl: "Ł vs L",
        bodyUk: "Літера **ł** читається як англійське _w_ в слові _water_.",
        bodyPl: "Litera **ł** brzmi jak англійське _w_."
      },
      {
        id: "fact-5",
        titleUk: "Заперечення і відмінки",
        titlePl: "Negacja i przypadki",
        bodyUk: "Після заперечення часто використовують родовий відмінок.",
        bodyPl: "Po negacji często używa się dopełniacza."
      }
    ],
    sidebarNoteUk: "Факти будуть зʼявлятися короткими блоками для щоденного читання.\n- 1 факт = 1 блок\n- короткі пояснення",
    sidebarNotePl: "Fakty będą pojawiać się krótkimi blokami do codziennego czytania.",
    sidebarPlanUk: "Редактор: хронологія, джерела, регіони.\n- теги\n- автори",
    sidebarPlanPl: "Edytor: chronologia, źródła, regiony."
  },
  culture: {
    hero: {
      titleUk: "Контекст, що пояснює мову",
      titlePl: "Kontekst, który wyjaśnia język",
      subtitleUk: "Соціальні коди, звички, традиції та міський побут.",
      subtitlePl: "Kody społeczne, zwyczaje, tradycje.",
      leadUk: "Культура допомагає відчувати інтонацію, стиль і контекст розмови.",
      leadPl: "Kultura pomaga poczuć intonację i styl."
    },
    pulses: [
      {
        id: "city",
        titleUk: "Міські ритми",
        titlePl: "Rytm miast",
        bodyUk: "Транспорт, кавʼярні, темп розмов і локальні етикети.",
        bodyPl: "Transport, kawiarnie, tempo rozmów i lokalna etykieta."
      },
      {
        id: "traditions",
        titleUk: "Традиції",
        titlePl: "Tradycje",
        bodyUk: "Свята, їжа, родинні зустрічі, символи.",
        bodyPl: "Święta, jedzenie, spotkania rodzinne, symbole."
      },
      {
        id: "art",
        titleUk: "Сцена",
        titlePl: "Scena",
        bodyUk: "Театр, музика, література та події.",
        bodyPl: "Teatr, muzyka, literatura i wydarzenia."
      },
      {
        id: "etiquette",
        titleUk: "Етикет",
        titlePl: "Etykieta",
        bodyUk: "Форми ввічливості, дистанція, звертання.",
        bodyPl: "Formy grzeczności, dystans, zwroty."
      },
      {
        id: "work",
        titleUk: "Побут і робота",
        titlePl: "Życie i praca",
        bodyUk: "Ритми робочого дня, small talk, важливі звички.",
        bodyPl: "Rytmy dnia pracy, small talk, ważne zwyczaje."
      }
    ],
    sidebarNoteUk: "Плануємо: карти міст, добірки подій, пояснення етикету.\n- календар свят\n- популярні формати зустрічей",
    sidebarNotePl: "Planujemy: mapy miast, zestawienia wydarzeń, wyjaśnienia etykiety.",
    sidebarPlanUk: "Редактор підтримуватиме блоки й шаблони.\n- фото/відео\n- таймлайни",
    sidebarPlanPl: "Edytor będzie wspierał bloki i szablony."
  }
};
