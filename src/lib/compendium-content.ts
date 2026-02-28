export type CompendiumHero = {
  titleUk: string;
  titlePl: string;
  subtitleUk: string;
  subtitlePl: string;
  leadUk: string;
  leadPl: string;
};

export type QuizQuestion = {
  id: string;
  questionUk: string;
  questionPl: string;
  options: string[]; // Answer options (same for both languages if Polish words)
  correctIndex: number; // Index of correct answer
  explanationUk?: string; // Why this is correct
  explanationPl?: string;
};

export type CompendiumSprint = {
  id: string;
  titleUk: string;
  titlePl: string;
  hintUk: string;
  hintPl: string;
  // Extended fields for deep learning
  detailedUk?: string; // Detailed explanation
  detailedPl?: string;
  examplesUk?: string[]; // Practical examples
  examplesPl?: string[];
  exampleExplanationsUk?: string[]; // Detailed breakdown of each example (for flashcards)
  exampleExplanationsPl?: string[];
  commonMistakesUk?: string; // Common mistakes to avoid
  commonMistakesPl?: string;
  tipsUk?: string; // Learning tips
  tipsPl?: string;
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'; // CEFR level
  relatedTopics?: string[]; // IDs of related sprints/rules
  estimatedMinutes?: number; // Study time estimate
  quizQuestions?: QuizQuestion[]; // Interactive quiz questions
};

export type CompendiumRule = {
  id: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
  // Extended fields for deep learning
  detailedUk?: string; // Detailed explanation with edge cases
  detailedPl?: string;
  examplesUk?: string[]; // Multiple examples with translations
  examplesPl?: string[];
  exampleExplanationsUk?: string[]; // Detailed breakdown of each example (for flashcards)
  exampleExplanationsPl?: string[];
  counterExamplesUk?: string[]; // What NOT to do
  counterExamplesPl?: string[];
  mnemonicUk?: string; // Memory tricks
  mnemonicPl?: string;
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category?: 'cases' | 'verbs' | 'adjectives' | 'syntax' | 'other'; // Topic category
  relatedRules?: string[]; // IDs of related rules
  practiceUrl?: string; // Link to practice exercises (optional)
  quizQuestions?: QuizQuestion[]; // Interactive quiz questions
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
        hintPl: "- **do** → dopełniacz\n- **w/na** → miejscownik\n- **przez** → biernik",
        detailedUk: "Польська має 7 відмінків, але на практиці найчастіше використовуються 4-5. Кожен відмінок відповідає на певне питання і використовується з конкретними прийменниками. Ключ до успіху — запамʼятати прийменники-маркери.",
        detailedPl: "Polski ma 7 przypadków, ale w praktyce najczęściej używa się 4-5. Każdy przypadek odpowiada na konkretne pytanie i występuje z określonymi przyimkami. Klucz do sukcesu to zapamiętanie przyimków-markerów.",
        examplesUk: [
          "**Mianownik** (називний): To jest **kot** (Це кіт)",
          "**Dopełniacz** (родовий): Nie ma **kota** (Немає кота) — після **nie ma, do, od, bez, z**",
          "**Celownik** (давальний): Daję **kotu** mleko (Даю коту молоко)",
          "**Biernik** (знахідний): Widzę **kota** (Бачу кота) — після **przez, na, w** (рух)",
          "**Narzędnik** (орудний): Idę z **kotem** (Йду з котом) — після **z, przed, nad, pod**",
          "**Miejscownik** (місцевий): Myślę o **kocie** (Думаю про кота) — після **w, na, o, po, przy**"
        ],
        examplesPl: [
          "**Mianownik**: To jest **kot**",
          "**Dopełniacz**: Nie ma **kota** — po **nie ma, do, od, bez, z**",
          "**Celownik**: Daję **kotu** mleko",
          "**Biernik**: Widzę **kota** — po **przez, na, w** (ruch)",
          "**Narzędnik**: Idę z **kotem** — po **z, przed, nad, pod**",
          "**Miejscownik**: Myślę o **kocie** — po **w, na, o, po, przy**"
        ],
        exampleExplanationsUk: [
          "**Mianownik** — початкова форма. Відповідає на 'хто? що?'. Використовується як підмет речення.",
          "**Dopełniacz** — змінюємо закінчення з -∅ на **-a**. Після 'nie ma' ЗАВЖДИ родовий! Також після прийменників 'do, od, bez, z (звідки)'.",
          "**Celownik** — закінчення **-u** для чоловічого роду. Після дієслова 'dawać' (давати). Відповідає на 'кому? чому?'.",
          "**Biernik** — для живих істот те саме що родовий (**-a**). Використовується після 'widzę, lubię, znam' та прийменників руху.",
          "**Narzędnik** — закінчення **-em**. ЗАВЖДИ після 'z' (з ким?). Також після 'przed, nad, pod, za' (позиція).",
          "**Miejscownik** — закінчення **-e** + м'якшення (k→c, g→dz). Після 'o' (про), 'w, na, po, przy' (де? — статична позиція)."
        ],
        exampleExplanationsPl: [
          "**Mianownik** — forma podstawowa. Odpowiada na 'kto? co?'. Używana jako podmiot zdania.",
          "**Dopełniacz** — końcówka **-a**. Po 'nie ma' ZAWSZE dopełniacz! Także po 'do, od, bez, z (skąd)'.",
          "**Celownik** — końcówka **-u** dla rodzaju męskiego. Po czasowniku 'dawać'. Odpowiada na 'komu? czemu?'.",
          "**Biernik** — dla żywych istot taki sam jak dopełniacz (**-a**). Po 'widzę, lubię, znam' i przyimkach ruchu.",
          "**Narzędnik** — końcówka **-em**. ZAWSZE po 'z' (z kim?). Także po 'przed, nad, pod, za' (pozycja).",
          "**Miejscownik** — końcówka **-e** + zmiękczenie (k→c, g→dz). Po 'o' (o czym), 'w, na, po, przy' (gdzie? — statyczna pozycja)."
        ],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Яку форму використати: 'Idę ___ szkoły' (Йду ЗІ школи)?",
            questionPl: "Jaka forma: 'Idę ___ szkoły' (wracam)?",
            options: ["do", "z", "w", "na"],
            correctIndex: 1,
            explanationUk: "'Z' + родовий відмінок для руху 'звідки'. **z szkoły** = зі школи (звідки?)",
            explanationPl: "'Z' + dopełniacz dla ruchu 'skąd'. **z szkoły** = ze szkoły (skąd?)"
          },
          {
            id: "q2",
            questionUk: "Виберіть правильну форму: 'Widzę ___' (Бачу кота)",
            questionPl: "Poprawna forma: 'Widzę ___' (widzę kota)",
            options: ["kot", "kota", "kotu", "kotem"],
            correctIndex: 1,
            explanationUk: "Після 'widzę' (бачу) → знахідний відмінок. Для живих істот = родовий → **kota**",
            explanationPl: "Po 'widzę' → biernik. Dla żywych istot = dopełniacz → **kota**"
          },
          {
            id: "q3",
            questionUk: "Де помилка? 'Jestem w szkole' (Я У школі)",
            questionPl: "Gdzie błąd? 'Jestem w szkole'",
            options: ["Немає помилки", "Треба 'do szkoły'", "Треба 'na szkole'", "Треба 'z szkoły'"],
            correctIndex: 0,
            explanationUk: "✅ Правильно! 'w' + місцевий для статичної позиції (де?). **w szkole** = у школі (де я зараз?)",
            explanationPl: "✅ Poprawnie! 'w' + miejscownik dla statycznej pozycji (gdzie?). **w szkole** = w szkole (gdzie teraz jestem?)"
          }
        ],
        commonMistakesUk: "❌ **w szkole** (місцевий, де?) vs ✅ **do szkoły** (родовий, куди?)\n❌ **z domu** (родовий, звідки?) плутають з **w domu** (місцевий, де?)",
        commonMistakesPl: "❌ **w szkole** (miejscownik, gdzie?) vs ✅ **do szkoły** (dopełniacz, dokąd?)\n❌ **z domu** (dopełniacz, skąd?) mylą z **w domu** (miejscownik, gdzie?)",
        tipsUk: "💡 Створи таблицю прийменників з відмінками. Практикуй на 5-10 словах щодня, міняючи відмінки.",
        tipsPl: "💡 Stwórz tabelę przyimków z przypadkami. Ćwicz na 5-10 słowach dziennie, zmieniając przypadki.",
        difficulty: "A2",
        relatedTopics: ["prepositions"],
        estimatedMinutes: 15
      },
      {
        id: "verbs",
        titleUk: "Дієслова",
        titlePl: "Czasowniki",
        hintUk: "Знайди пару **dokonany/niedokonany** і тримай її поруч у нотатках.",
        hintPl: "Znajdź parę **dokonany/niedokonany** i trzymaj ją pod ręką.",
        detailedUk: "Система видів (aspektów) — найважливіша особливість польських дієслів. **Недоконаний вид** (robić) описує процес, звичку. **Доконаний вид** (zrobić) — завершену дію, результат. Більшість дієслів мають обидва види.",
        detailedPl: "System aspektów to najważniejsza cecha polskich czasowników. **Aspekt niedokonany** (robić) opisuje proces, nawyk. **Aspekt dokonany** (zrobić) — zakończoną czynność, wynik. Większość czasowników ma oba aspekty.",
        examplesUk: [
          "**Niedokonany**: Czytam książkę (Читаю книгу — процес)",
          "**Dokonany**: Przeczytam książkę (Прочитаю книгу — завершу)",
          "**Niedokonany**: Piszę list (Пишу листа — зараз)",
          "**Dokonany**: Napiszę list (Напишу листа — закінчу)",
          "**Pary**: robić/zrobić, pisać/napisać, czytać/przeczytać"
        ],
        examplesPl: [
          "**Niedokonany**: Czytam książkę (proces)",
          "**Dokonany**: Przeczytam książkę (ukończę)",
          "**Niedokonany**: Piszę list (teraz)",
          "**Dokonany**: Napiszę list (zakończę)",
          "**Pary**: robić/zrobić, pisać/napisać, czytać/przeczytać"
        ],
        exampleExplanationsUk: [
          "**czytam** — недоконаний вид. Описує ПРОЦЕС читання зараз. Не важливо чи закінчу. Форма теперішнього часу можлива тільки для недоконаного виду!",
          "**przeczytam** — доконаний вид (префікс **prze-**). Означає ЗАВЕРШУ читання. Це майбутній час! Доконаний вид не має теперішнього.",
          "**piszę** — недоконаний, процес. Пишу зараз, але чи закінчу — невідомо. Можу писати годинами.",
          "**napiszę** — доконаний (префікс **na-**). Завершу писання. Одноразова завершена дія в майбутньому.",
          "**Парний принцип**: кожна пара відрізняється префіксом або суфіксом. robić → **z**robić, pisać → **na**pisać. Запам'ятовуй парами!"
        ],
        exampleExplanationsPl: [
          "**czytam** — aspekt niedokonany. Opisuje PROCES czytania teraz. Nieważne czy skończę. Czas teraźniejszy możliwy tylko dla niedokonanego!",
          "**przeczytam** — aspekt dokonany (prefiks **prze-**). Oznacza UKOŃCZĘ czytanie. To czas przyszły! Dokonany nie ma teraźniejszego.",
          "**piszę** — niedokonany, proces. Piszę teraz, ale czy skończę — nieznane. Mogę pisać godzinami.",
          "**napiszę** — dokonany (prefiks **na-**). Ukończę pisanie. Jednorazowa zakończona czynność w przyszłości.",
          "**Zasada par**: każda para różni się prefiksem lub sufiksem. robić → **z**robić, pisać → **na**pisać. Ucz się parami!"
        ],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Яка форма правильна: 'Teraz ___ książkę' (Зараз читаю книгу)?",
            questionPl: "Jaka forma: 'Teraz ___ książkę'?",
            options: ["czytam", "przeczytam", "czytałem", "przeczytałem"],
            correctIndex: 0,
            explanationUk: "Теперішній час → тільки недоконаний вид! **czytam** = читаю (процес зараз)",
            explanationPl: "Czas teraźniejszy → tylko niedokonany! **czytam** = czytam (proces teraz)"
          },
          {
            id: "q2",
            questionUk: "Виберіть для завершеної дії: 'Wczoraj ___ list' (Вчора написав листа)",
            questionPl: "Dla zakończonej czynności: 'Wczoraj ___ list'",
            options: ["pisałem", "napisałem", "piszę", "napiszę"],
            correctIndex: 1,
            explanationUk: "Минулий час + завершена дія → доконаний вид! **napisałem** (написав і закінчив)",
            explanationPl: "Czas przeszły + zakończona czynność → dokonany! **napisałem** (napisałem i skończyłem)"
          },
          {
            id: "q3",
            questionUk: "Що означає 'zrobię'?",
            questionPl: "Co znaczy 'zrobię'?",
            options: ["Роблю зараз", "Зроблю (завершу)", "Робив раніше", "Буду робити довго"],
            correctIndex: 1,
            explanationUk: "**zrobię** = зроблю (доконаний + майбутній). Завершу дію в майбутньому!",
            explanationPl: "**zrobię** = zrobię (dokonany + przyszły). Ukończę czynność w przyszłości!"
          }
        ],
        commonMistakesUk: "❌ Вживати доконаний вид для теперішнього часу: **zrobię teraz** → ✅ **robię teraz**\n❌ Недоконаний вид для разової дії: **Wczoraj pisałem list** → ✅ **Wczoraj napisałem list**",
        commonMistakesPl: "❌ Używać aspektu dokonanego w czasie teraźniejszym: **zrobię teraz** → ✅ **robię teraz**\n❌ Aspekt niedokonany dla jednorazowej czynności: **Wczoraj pisałem list** → ✅ **Wczoraj napisałem list**",
        tipsUk: "💡 Почни з 10 найчастіших пар дієслів. Створи картки: на одній стороні недоконаний, на іншій — доконаний.",
        tipsPl: "💡 Zacznij od 10 najczęstszych par czasowników. Twórz fiszki: z jednej strony niedokonany, z drugiej — dokonany.",
        difficulty: "A2",
        relatedTopics: ["present", "past"],
        estimatedMinutes: 20
      },
      {
        id: "prepositions",
        titleUk: "Прийменники",
        titlePl: "Przyimki",
        hintUk: "Запамʼятовуй звʼязки: **do + G**, **na + B/M**, **z + N**.",
        hintPl: "Zapamiętuj połączenia: **do + D**, **na + B/M**, **z + N**.",
        detailedUk: "Кожен прийменник керує певним відмінком. Деякі можуть вживатися з кількома відмінками залежно від значення (рух vs позиція). Ключ — запамʼятати найчастіші комбінації.",
        detailedPl: "Każdy przyimek rządzi określonym przypadkiem. Niektóre mogą występować z kilkoma przypadkami w zależności od znaczenia (ruch vs pozycja). Klucz — zapamiętać najczęstsze połączenia.",
        examplesUk: [
          "**do** + родовий: do szkoły (до школи), do domu (додому)",
          "**z/ze** + родовий (звідки): z domu (з дому), ze szkoły (зі школи)",
          "**z/ze** + орудний (з ким?): z kotem (з котом), z przyjacielem (з другом)",
          "**na** + знахідний (куди?): na spacer (на прогулянку), na uniwersytet (в університет)",
          "**na** + місцевий (де?): na uniwersytecie (в університеті), na ulicy (на вулиці)",
          "**w/we** + місцевий: w domu (вдома), w szkole (у школі)",
          "**o** + місцевий: o tobie (про тебе), o filmie (про фільм)"
        ],
        examplesPl: [
          "**do** + dopełniacz: do szkoły, do domu",
          "**z/ze** + dopełniacz (skąd): z domu, ze szkoły",
          "**z/ze** + narzędnik (z kim?): z kotem, z przyjacielem",
          "**na** + biernik (dokąd?): na spacer, na uniwersytet",
          "**na** + miejscownik (gdzie?): na uniwersytecie, na ulicy",
          "**w/we** + miejscownik: w domu, w szkole",
          "**o** + miejscownik: o tobie, o filmie"
        ],
        exampleExplanationsUk: [
          "**do + G**: завжди для напрямку руху. Питання: куди? → **do szkoły** (до школи, куди йду?)",
          "**z + G**: для вихідної точки руху. Питання: звідки? → **z domu** (з дому, звідки виходжу?)",
          "**z + N**: для компанії, інструменту. Питання: з ким? з чим? → **z kotem** (з котом, компанія)",
          "**na + B**: рух на поверхню або подію. **na spacer** (йду НА прогулянку), **na uniwersytet** (їду В університет — устале)",
          "**na + M**: статична позиція на поверхні. **na uniwersytecie** (я В університеті зараз), **na ulicy** (на вулиці)",
          "**w + M**: статична позиція всередині. **w domu** (вдома, всередині будинку), **w szkole** (у школі)",
          "**o + M**: тема розмови, думки. **o tobie** (про тебе), **o filmie** (про фільм)"
        ],
        exampleExplanationsPl: [
          "**do + D**: zawsze dla kierunku ruchu. Pytanie: dokąd? → **do szkoły** (do szkoły, dokąd idę?)",
          "**z + D**: dla punktu wyjścia. Pytanie: skąd? → **z domu** (z domu, skąd wychodzę?)",
          "**z + N**: dla towarzystwa, narzędzia. Pytanie: z kim? z czym? → **z kotem** (z kotem, towarzystwo)",
          "**na + B**: ruch na powierzchnię lub wydarzenie. **na spacer** (idę NA spacer), **na uniwersytet** (jadę NA uniwersytet — utarte)",
          "**na + M**: statyczna pozycja na powierzchni. **na uniwersytecie** (jestem NA uniwersytecie teraz), **na ulicy** (na ulicy)",
          "**w + M**: statyczna pozycja wewnątrz. **w domu** (w domu, wewnątrz budynku), **w szkole** (w szkole)",
          "**o + M**: temat rozmowy, myśli. **o tobie** (o tobie), **o filmie** (o filmie)"
        ],
        commonMistakesUk: "❌ **w uniwersytet** → ✅ **na uniwersytet** (wyjątek!)\n❌ **do domu** (де?) → ✅ **w domu** (де?), **do domu** (куди?)",
        commonMistakesPl: "❌ **w uniwersytet** → ✅ **na uniwersytet** (wyjątek!)\n❌ **do domu** (gdzie?) → ✅ **w domu** (gdzie?), **do domu** (dokąd?)",
        tipsUk: "💡 Створи таблицю 'рух vs позиція': do/z (рух) ↔ w/na (позиція). Практикуй на 5 місцях.",
        tipsPl: "💡 Stwórz tabelę 'ruch vs pozycja': do/z (ruch) ↔ w/na (pozycja). Ćwicz na 5 miejscach.",
        difficulty: "A2",
        relatedTopics: ["cases"],
        estimatedMinutes: 12,
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Доповни: 'Idę ___ szkoły' (Йду ЗІ школи)",
            questionPl: "Uzupełnij: 'Idę ___ szkoły'",
            options: ["do", "z", "w", "na"],
            correctIndex: 1,
            explanationUk: "'z' + родовий для руху 'звідки'. **z szkoły** = зі школи",
            explanationPl: "'z' + dopełniacz dla ruchu 'skąd'. **z szkoły** = ze szkoły"
          },
          {
            id: "q2",
            questionUk: "'Mieszkam ___ Krakowie' (Живу в Кракові)",
            questionPl: "'Mieszkam ___ Krakowie'",
            options: ["do", "w", "na", "z"],
            correctIndex: 1,
            explanationUk: "'w' + місцевий для статичної позиції (де?). **w Krakowie**",
            explanationPl: "'w' + miejscownik dla statycznej pozycji (gdzie?). **w Krakowie**"
          }
        ]
      },
      {
        id: "order",
        titleUk: "Порядок слів",
        titlePl: "Szyk",
        hintUk: "Базово: **підмет → дієслово → обʼєкт**, але нове став ближче до кінця.",
        hintPl: "Bazowo: **podmiot → czasownik → dopełnienie**, nowe bliżej końca.",
        detailedUk: "Польська має гнучкий порядок слів завдяки відмінковій системі. Нейтральний порядок: SVO (Subject-Verb-Object). Але НОВА інформація йде ближче до кінця речення для акценту.",
        detailedPl: "Polski ma elastyczny szyk dzięki systemowi przypadków. Neutralny szyk: SVO (Subject-Verb-Object). Ale NOWA informacja idzie bliżej końca zdania dla akcentu.",
        examplesUk: [
          "Нейтральний: **Jan czyta książkę** (Ян читає книгу)",
          "Акцент на дії: **Książkę czyta Jan** (Книгу читає Ян — хто? Ян!)",
          "Акцент на об'єкті: **Jan czyta KSIĄŻKĘ** (Ян читає КНИГУ, не журнал)",
          "Питання: **Co czyta Jan?** (Що читає Ян?) → **Jan czyta książkę** (нове = книгу)"
        ],
        examplesPl: [
          "Neutralny: **Jan czyta książkę**",
          "Akcent na czynności: **Książkę czyta Jan** (kto? Jan!)",
          "Akcent na przedmiocie: **Jan czyta KSIĄŻKĘ** (nie czasopismo)",
          "Pytanie: **Co czyta Jan?** → **Jan czyta książkę** (nowe = książkę)"
        ],
        difficulty: "B1",
        estimatedMinutes: 10
      },
      {
        id: "questions",
        titleUk: "Питання",
        titlePl: "Pytania",
        hintUk: "**czy** для загальних, **kto/co/gdzie** для конкретних.",
        hintPl: "**czy** dla ogólnych, **kto/co/gdzie** dla konkretnych.",
        detailedUk: "Є два типи питань: **загальні** (так/ні) з часткою 'czy' та **спеціальні** з питальними словами (kto, co, gdzie, kiedy, dlaczego). Інтонація також важлива!",
        detailedPl: "Są dwa typy pytań: **ogólne** (tak/nie) z partykułą 'czy' oraz **szczególne** z zaimkami pytającymi (kto, co, gdzie, kiedy, dlaczego). Intonacja też jest ważna!",
        examplesUk: [
          "**Czy** lubisz kawę? (Чи любиш каву?) — загальне питання",
          "**Co** robisz? (Що робиш?) — спеціальне, про дію",
          "**Gdzie** mieszkasz? (Де живеш?) — про місце",
          "**Kiedy** przyjdziesz? (Коли прийдеш?) — про час",
          "**Dlaczego** się spóźniłeś? (Чому спізнився?) — про причину"
        ],
        examplesPl: [
          "**Czy** lubisz kawę? — pytanie ogólne",
          "**Co** robisz? — szczególne, o czynności",
          "**Gdzie** mieszkasz? — o miejscu",
          "**Kiedy** przyjdziesz? — o czasie",
          "**Dlaczego** się spóźniłeś? — o przyczynę"
        ],
        exampleExplanationsUk: [
          "**Czy** — частка для так/ні питань. Можна опустити і просто підняти інтонацію: Lubisz kawę↗?",
          "**Co** — що? Для предметів, дій. Завжди знахідний: Co widzisz? (Що бачиш?)",
          "**Gdzie** — де? Для місця. Можна + прийменник: Gdzie mieszkasz? (де живеш?), Dokąd idziesz? (куди йдеш?)",
          "**Kiedy** — коли? Для часу. Kiedy przyjdziesz? (коли прийдеш?)",
          "**Dlaczego** — чому? Для причини. Dlaczego? = Bo... (чому? тому що...)"
        ],
        exampleExplanationsPl: [
          "**Czy** — partykuła dla pytań tak/nie. Można pominąć i podnieść intonację: Lubisz kawę↗?",
          "**Co** — co? Dla przedmiotów, czynności. Zawsze biernik: Co widzisz?",
          "**Gdzie** — gdzie? Dla miejsca. Można + przyimek: Gdzie mieszkasz?, Dokąd idziesz?",
          "**Kiedy** — kiedy? Dla czasu. Kiedy przyjdziesz?",
          "**Dlaczego** — dlaczego? Dla przyczyny. Dlaczego? = Bo..."
        ],
        difficulty: "A1",
        estimatedMinutes: 8,
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Як запитати 'Де ти живеш?'",
            questionPl: "Jak zapytać 'Gdzie mieszkasz?'",
            options: ["Co mieszkasz?", "Gdzie mieszkasz?", "Kiedy mieszkasz?", "Czy mieszkasz?"],
            correctIndex: 1,
            explanationUk: "**Gdzie** = де? → **Gdzie mieszkasz?**",
            explanationPl: "**Gdzie** = gdzie? → **Gdzie mieszkasz?**"
          },
          {
            id: "q2",
            questionUk: "Питання так/ні: '___ lubisz kawę?'",
            questionPl: "Pytanie tak/nie: '___ lubisz kawę?'",
            options: ["Co", "Gdzie", "Czy", "Kto"],
            correctIndex: 2,
            explanationUk: "Загальне питання → **Czy** lubisz kawę?",
            explanationPl: "Pytanie ogólne → **Czy** lubisz kawę?"
          }
        ]
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
          "Najczęstsze końcówki:\n- **-am/-em** (ja)\n- **-asz/-esz** (ty)\n- **-a/-e/-i** (on/ona/ono)",
        detailedUk: "Теперішній час утворюється тільки від недоконаних дієслів. Існує 4 основні групи відмінювання (-ać, -eć/-yć, -ić, -ować). Закінчення залежить від особи та групи дієслова.",
        detailedPl: "Czas teraźniejszy tworzy się tylko od czasowników niedokonanych. Istnieją 4 główne grupy koniugacji (-ać, -eć/-yć, -ić, -ować). Końcówki zależą od osoby i grupy czasownika.",
        examplesUk: [
          "**robić** (робити): robię, robisz, robi, robimy, robicie, robią",
          "**pisać** (писати): piszę, piszesz, pisze, piszemy, piszecie, piszą",
          "**czytać** (читати): czytam, czytasz, czyta, czytamy, czytacie, czytają",
          "**mówić** (говорити): mówię, mówisz, mówi, mówimy, mówicie, mówią"
        ],
        examplesPl: [
          "**robić**: robię, robisz, robi, robimy, robicie, robią",
          "**pisać**: piszę, piszesz, pisze, piszemy, piszecie, piszą",
          "**czytać**: czytam, czytasz, czyta, czytamy, czytacie, czytają",
          "**mówić**: mówię, mówisz, mówi, mówimy, mówicie, mówią"
        ],
        exampleExplanationsUk: [
          "**robić** (група -ić): 1 особа → **-ę** (robię), 2 → **+sz** (robisz), 3 → **-i** (robi). Множина: my/wy/oni → -imy/-icie/-ią",
          "**pisać** (група -ać з чергуванням): основа zmінюється! pis- → pisz-. 1 особа → **-ę** (piszę), решта аналогічно. Чергування голосних!",
          "**czytać** (стандартна група -ać): 1 особа → **-am** (czytam), НЕ -ę! Це ключова відмінність від -ić/-eć. Решта +sz, -a, +my, +cie, +ją",
          "**mówić** (група -ić з чергуванням): 1 особа → **-ę** (mówię). Всі дієслова на -ić мають -ę в 1 особі! mów- → mówi-"
        ],
        exampleExplanationsPl: [
          "**robić** (grupa -ić): 1 osoba → **-ę** (robię), 2 → **+sz** (robisz), 3 → **-i** (robi). Liczba mnoga: my/wy/oni → -imy/-icie/-ią",
          "**pisać** (grupa -ać z alternacją): temat się zmienia! pis- → pisz-. 1 osoba → **-ę** (piszę), reszta analogicznie. Alternacja!",
          "**czytać** (standardowa grupa -ać): 1 osoba → **-am** (czytam), NIE -ę! To kluczowa różnica od -ić/-eć. Reszta +sz, -a, +my, +cie, +ją",
          "**mówić** (grupa -ić z alternacją): 1 osoba → **-ę** (mówię). Wszystkie czasowniki na -ić mają -ę w 1 osobie! mów- → mówi-"
        ],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "1 особа від 'czytać'?",
            questionPl: "1 osoba od 'czytać'?",
            options: ["czytę", "czytam", "czytaję", "czytamy"],
            correctIndex: 1,
            explanationUk: "Група -ać → 1 особа **-am**! czytać → **czytam** (НЕ -ę!)",
            explanationPl: "Grupa -ać → 1 osoba **-am**! czytać → **czytam** (NIE -ę!)"
          },
          {
            id: "q2",
            questionUk: "3 особа множини від 'mówić'?",
            questionPl: "3 osoba liczby mnogiej od 'mówić'?",
            options: ["mówią", "mówią", "mówią", "mówią"],
            correctIndex: 0,
            explanationUk: "Група -ić → 3 множина **-ią** або **-ą**. mówić → mówi → **mówią**",
            explanationPl: "Grupa -ić → 3 l.mn. **-ią** lub **-ą**. mówić → mówi → **mówią**"
          },
          {
            id: "q3",
            questionUk: "Чому 'piszę', а не 'pisam'?",
            questionPl: "Dlaczego 'piszę', a nie 'pisam'?",
            options: ["Помилка в питанні", "Чергування s→sz", "Група -ać має -ę", "Виняток"],
            correctIndex: 1,
            explanationUk: "pisać має чергування: pis- → **pisz-** у всіх формах. Тому piszę, piszesz... (НЕ pisam!)",
            explanationPl: "pisać ma alternację: pis- → **pisz-** we wszystkich formach. Dlatego piszę, piszesz... (NIE pisam!)"
          }
        ],
        counterExamplesUk: [
          "❌ **zrobię** — це майбутній, не теперішній!",
          "❌ **piszam** → ✅ **piszę** (1 особа має -ę)",
          "❌ **czytaę** → ✅ **czytam** (група -ać: -am, не -ę)"
        ],
        counterExamplesPl: [
          "❌ **zrobię** — to przyszły, nie teraźniejszy!",
          "❌ **piszam** → ✅ **piszę** (1 osoba ma -ę)",
          "❌ **czytaę** → ✅ **czytam** (grupa -ać: -am, nie -ę)"
        ],
        mnemonicUk: "🧠 **Я (-am/-ę) → Ти (+sz) → Він/Вона (-a/-e/-i) → Ми (+my) → Ви (+cie) → Вони (-ą/-ją)**",
        mnemonicPl: "🧠 **Ja (-am/-ę) → Ty (+sz) → On/Ona (-a/-e/-i) → My (+my) → Wy (+cie) → Oni (-ą/-ją)**",
        difficulty: "A1",
        category: "verbs",
        relatedRules: ["past", "future"]
      },
      {
        id: "past",
        titleUk: "Минулий час",
        titlePl: "Czas przeszły",
        bodyUk: "Форми залежать від роду: _zrobiłem_ / _zrobiłam_. У множині: _zrobiliśmy_.",
        bodyPl: "Formy zależą od rodzaju: _zrobiłem_ / _zrobiłam_. W liczbie mnogiej: _zrobiliśmy_.",
        detailedUk: "Минулий час утворюється додаванням закінчень до основи дієслова. КЛЮЧОВА особливість: закінчення змінюються залежно від РОДУ (чоловічий, жіночий, середній) та ЧИСЛА. Використовуються обидва види: недоконаний (процес) та доконаний (результат).",
        detailedPl: "Czas przeszły tworzy się przez dodanie końcówek do tematu czasownika. KLUCZOWA cecha: końcówki zmieniają się w zależności od RODZAJU (męski, żeński, nijaki) i LICZBY. Używa się obu aspektów: niedokonany (proces) i dokonany (rezultat).",
        examplesUk: [
          "**robić** (чол.): (ja) robiłem, (ty) robiłeś, (on) robił",
          "**robić** (жін.): (ja) robiłam, (ty) robiłaś, (ona) robiła",
          "**robić** (множ.): (my) robiliśmy, (wy) robiliście, (oni) robili",
          "**zrobić** (доконаний): zrobiłem (завершив), zrobiłam (завершила)",
          "Вчора **robiłem** (робив, процес) vs **zrobiłem** (зробив, готово)"
        ],
        examplesPl: [
          "**robić** (męski): (ja) robiłem, (ty) robiłeś, (on) robił",
          "**robić** (żeński): (ja) robiłam, (ty) robiłaś, (ona) robiła",
          "**robić** (l.mn.): (my) robiliśmy, (wy) robiliście, (oni) robili",
          "**zrobić** (dokonany): zrobiłem (ukończyłem), zrobiłam (ukończyłam)",
          "Wczoraj **robiłem** (robiłem, proces) vs **zrobiłem** (zrobiłem, gotowe)"
        ],
        exampleExplanationsUk: [
          "**Чоловічий рід -łem/-łeś/-ł**: Закінчення для я/ти/він. robiłem (я робив), robiłeś (ти робив), robił (він робив)",
          "**Жіночий рід -łam/-łaś/-ła**: Закінчення для я/ти/вона. Зверніть увагу на **-a-** в закінченні!",
          "**Множина -liśmy/-liście/-li**: Для всіх родів у множині. -śmy (ми), -ście (ви), -li (вони)",
          "**Доконаний вид**: zrobiłem = ЗАВЕРШИВ дію. Одноразова, закінчена подія в минулому.",
          "**Недоконаний vs доконаний**: robiłem (робив довго, процес) ≠ zrobiłem (зробив і закінчив, результат)"
        ],
        exampleExplanationsPl: [
          "**Rodzaj męski -łem/-łeś/-ł**: Końcówki dla ja/ty/on. robiłem, robiłeś, robił",
          "**Rodzaj żeński -łam/-łaś/-ła**: Końcówki dla ja/ty/ona. Uwaga na **-a-** w końcówce!",
          "**Liczba mnoga -liśmy/-liście/-li**: Dla wszystkich rodzajów w l.mn. -śmy (my), -ście (wy), -li (oni)",
          "**Aspekt dokonany**: zrobiłem = UKOŃCZYŁEM czynność. Jednorazowe, zakończone wydarzenie w przeszłości.",
          "**Niedokonany vs dokonany**: robiłem (robiłem długo, proces) ≠ zrobiłem (zrobiłem i skończyłem, rezultat)"
        ],
        counterExamplesUk: [
          "❌ **robiłem** (жін.) → ✅ **robiłam** (потрібно -łam для жіночого!)",
          "❌ **piszłem** → ✅ **pisałem** (основа не змінюється: pisać → pisał-)",
          "❌ Wczoraj **robię** → ✅ **robiłem** (минуле, не теперішнє!)"
        ],
        counterExamplesPl: [
          "❌ **robiłem** (żeński) → ✅ **robiłam** (trzeba -łam dla żeńskiego!)",
          "❌ **piszłem** → ✅ **pisałem** (temat się nie zmienia: pisać → pisał-)",
          "❌ Wczoraj **robię** → ✅ **robiłem** (przeszły, nie teraźniejszy!)"
        ],
        mnemonicUk: "🧠 **Чоловічий -łem → Жіночий -łam → Множина -liśmy**. Запам'ятай: жіночий має додаткове **-a-**!",
        mnemonicPl: "🧠 **Męski -łem → Żeński -łam → Mnoga -liśmy**. Zapamiętaj: żeński ma dodatkowe **-a-**!",
        difficulty: "A1",
        category: "verbs",
        relatedRules: ["present", "aspect"],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Жіночий рід від 'robić' (я): Wczoraj ___ zadanie",
            questionPl: "Rodzaj żeński od 'robić' (ja): Wczoraj ___ zadanie",
            options: ["robiłem", "robiłam", "robiła", "robił"],
            correctIndex: 1,
            explanationUk: "Жіночий рід → **-łam**! Wczoraj **robiłam** zadanie (я-жін. робила)",
            explanationPl: "Rodzaj żeński → **-łam**! Wczoraj **robiłam** zadanie"
          },
          {
            id: "q2",
            questionUk: "Завершена дія: 'Wczoraj ___ książkę' (дочитав)",
            questionPl: "Zakończona czynność: 'Wczoraj ___ książkę'",
            options: ["czytałem", "przeczytałem", "czytam", "przeczytam"],
            correctIndex: 1,
            explanationUk: "Завершена дія → доконаний вид! **przeczytałem** = дочитав (і закінчив)",
            explanationPl: "Zakończona czynność → aspekt dokonany! **przeczytałem** = przeczytałem (i skończyłem)"
          },
          {
            id: "q3",
            questionUk: "Множина (ми): 'My ___ do domu'",
            questionPl: "Liczba mnoga (my): 'My ___ do domu'",
            options: ["szedł", "szła", "szliśmy", "szedłem"],
            correctIndex: 2,
            explanationUk: "Множина (ми) → **-liśmy**! My **szliśmy** do domu (ми йшли)",
            explanationPl: "Liczba mnoga (my) → **-liśmy**! My **szliśmy** do domu"
          }
        ]
      },
      {
        id: "cases-short",
        titleUk: "Коротко про відмінки",
        titlePl: "O przypadkach",
        bodyUk:
          "Швидка логіка:\n- **kogo? czego?** → родовий\n- **komu? czemu?** → давальний\n- **kogo? co?** → знахідний",
        bodyPl:
          "Szybka logika:\n- **kogo? czego?** → dopełniacz\n- **komu? czemu?** → celownik\n- **kogo? co?** → biernik",
        detailedUk: "Відмінки — це зміна закінчення слова залежно від його ролі в реченні. Кожен відмінок відповідає на конкретне питання. Найпростіший спосіб визначити відмінок — запитати до слова.",
        detailedPl: "Przypadki to zmiana końcówki słowa w zależności od jego roli w zdaniu. Każdy przypadek odpowiada na konkretne pytanie. Najprostszy sposób określić przypadek — zadać pytanie do słowa.",
        examplesUk: [
          "**Mianownik** (хто? що?): To jest **kot**",
          "**Dopełniacz** (кого? чого?): Nie ma **kota**",
          "**Celownik** (кому? чому?): Daję **kotu**",
          "**Biernik** (кого? що?): Widzę **kota** (живе) / **stół** (неживе)",
          "**Narzędnik** (ким? чим?): z **kotem**",
          "**Miejscownik** (про кого? про що? / де?): o **kocie**, w **domu**",
          "**Wołacz** (звертання): **Kocie!**, **Mamo!**"
        ],
        examplesPl: [
          "**Mianownik** (kto? co?): To jest **kot**",
          "**Dopełniacz** (kogo? czego?): Nie ma **kota**",
          "**Celownik** (komu? czemu?): Daję **kotu**",
          "**Biernik** (kogo? co?): Widzę **kota** (żywy) / **stół** (nieżywy)",
          "**Narzędnik** (kim? czym?): z **kotem**",
          "**Miejscownik** (o kim? o czym? / gdzie?): o **kocie**, w **domu**",
          "**Wołacz** (zawołanie): **Kocie!**, **Mamo!**"
        ],
        exampleExplanationsUk: [
          "**Mianownik** — словникова форма. Підмет речення. То є (хто?) **кіт**.",
          "**Dopełniacz** — після nie ma, do, od, z (звідки), bez. Немає (кого?) **кота**. Закінчення часто -a/-u/-y.",
          "**Celownik** — непрямий об'єкт. Даю (кому?) **коту**. Після dziękuję, pomagam. Закінчення -owi/-u/-ie.",
          "**Biernik** — прямий об'єкт. Бачу (кого?) **кота**. Для неживих = називний. Для живих = родовий.",
          "**Narzędnik** — інструмент, компанія. З (ким?) **котом**. Після z, przed, nad, pod. Закінчення -em/-ą.",
          "**Miejscownik** — локація, тема. Про (кого?) **кота**, в (де?) **домі**. Завжди з прийменником! Закінчення -e/-u.",
          "**Wołacz** — звертання. Гей, **коте**! Часто = називний, але є винятки: Mamo! Tato!"
        ],
        exampleExplanationsPl: [
          "**Mianownik** — forma słownikowa. Podmiot zdania. To jest (kto?) **kot**.",
          "**Dopełniacz** — po nie ma, do, od, z (skąd), bez. Nie ma (kogo?) **kota**. Końcówki często -a/-u/-y.",
          "**Celownik** — dopełnienie dalsze. Daję (komu?) **kotu**. Po dziękuję, pomagam. Końcówki -owi/-u/-ie.",
          "**Biernik** — dopełnienie bliższe. Widzę (kogo?) **kota**. Dla nieżywych = mianownik. Dla żywych = dopełniacz.",
          "**Narzędnik** — narzędzie, towarzystwo. Z (kim?) **kotem**. Po z, przed, nad, pod. Końcówki -em/-ą.",
          "**Miejscownik** — lokalizacja, temat. O (kim?) **kocie**, w (gdzie?) **domu**. Zawsze z przyimkiem! Końcówki -e/-u.",
          "**Wołacz** — wołanie. Hej, **kocie**! Często = mianownik, ale są wyjątki: Mamo! Tato!"
        ],
        mnemonicUk: "🧠 **M-D-C-B-N-M-W** → **Mianownik-Dopełniacz-Celownik-Biernik-Narzędnik-Miejscownik-Wołacz**. Питання допомагають!",
        mnemonicPl: "🧠 **M-D-C-B-N-M-W** → Pytania pomagają określić przypadek!",
        difficulty: "A2",
        category: "cases",
        relatedRules: ["present"],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Який відмінок: 'Nie ma ___' (чого?)",
            questionPl: "Jaki przypadek: 'Nie ma ___' (czego?)",
            options: ["Mianownik", "Dopełniacz", "Celownik", "Biernik"],
            correctIndex: 1,
            explanationUk: "Після 'nie ma' → **Dopełniacz** (родовий). Nie ma **czasu** (чого?)",
            explanationPl: "Po 'nie ma' → **Dopełniacz**. Nie ma **czasu** (czego?)"
          },
          {
            id: "q2",
            questionUk: "Який відмінок: 'z przyjacielem' (з ким?)",
            questionPl: "Jaki przypadek: 'z przyjacielem'?",
            options: ["Dopełniacz", "Celownik", "Narzędnik", "Miejscownik"],
            correctIndex: 2,
            explanationUk: "'z' (з ким?) → **Narzędnik** (орудний). z **przyjacielem**",
            explanationPl: "'z' (z kim?) → **Narzędnik**. z **przyjacielem**"
          },
          {
            id: "q3",
            questionUk: "Який відмінок: 'Widzę kota' (кого?)",
            questionPl: "Jaki przypadek: 'Widzę kota'?",
            options: ["Mianownik", "Dopełniacz", "Biernik", "Narzędnik"],
            correctIndex: 2,
            explanationUk: "Після 'widzę' (кого?) → **Biernik** (знахідний). Для живих = як родовий!",
            explanationPl: "Po 'widzę' → **Biernik**. Dla żywych = jak dopełniacz!"
          }
        ]
      },
      {
        id: "negation",
        titleUk: "Заперечення",
        titlePl: "Negacja",
        bodyUk: "Після заперечення часто переходять у родовий: _nie mam czasu_.",
        bodyPl: "Po negacji często pojawia się dopełniacz: _nie mam czasu_.",
        detailedUk: "Заперечення в польській утворюється за допомогою частки **nie** перед дієсловом. ВАЖЛИВА особливість: після заперечення прямий додаток (знахідний) часто змінюється на родовий відмінок.",
        detailedPl: "Negacja w polskim tworzy się przez dodanie partykuły **nie** przed czasownikiem. WAŻNA cecha: po negacji dopełnienie bliższe (biernik) często zmienia się na dopełniacz.",
        examplesUk: [
          "**Mam czas** (знахідний) → **Nie mam czasu** (родовий!)",
          "**Widzę kota** (знахідний) → **Nie widzę kota** (родовий)",
          "**Lubię kawę** (знахідний) → **Nie lubię kawy** (родовий!)",
          "**Jest kot** → **Nie ma kota** (nie ma завжди + родовий)",
          "**Znam język** → **Nie znam języka** (родовий)"
        ],
        examplesPl: [
          "**Mam czas** (biernik) → **Nie mam czasu** (dopełniacz!)",
          "**Widzę kota** (biernik) → **Nie widzę kota** (dopełniacz)",
          "**Lubię kawę** (biernik) → **Nie lubię kawy** (dopełniacz!)",
          "**Jest kot** → **Nie ma kota** (nie ma zawsze + dopełniacz)",
          "**Znam język** → **Nie znam języka** (dopełniacz)"
        ],
        exampleExplanationsUk: [
          "**Mam czas** (B) → **Nie mam czasu** (D). Після 'nie' знахідний **czas** → родовий **czasu**!",
          "**Widzę kota** — 'kota' вже родовий (живе), тому після 'nie' залишається: **Nie widzę kota**.",
          "**Lubię kawę** (B) → **Nie lubię kawy** (D). kawę → kawy (зміна закінчення -ę → -y).",
          "**Nie ma** — спеціальна конструкція. ЗАВЖДИ + родовий! Jest **kot** → Nie ma **kota**.",
          "**Znam język** (B) → **Nie znam języka** (D). język → języka (родовий після заперечення)."
        ],
        exampleExplanationsPl: [
          "**Mam czas** (B) → **Nie mam czasu** (D). Po 'nie' biernik **czas** → dopełniacz **czasu**!",
          "**Widzę kota** — 'kota' już dopełniacz (żywy), więc po 'nie' zostaje: **Nie widzę kota**.",
          "**Lubię kawę** (B) → **Nie lubię kawy** (D). kawę → kawy (zmiana końcówki -ę → -y).",
          "**Nie ma** — specjalna konstrukcja. ZAWSZE + dopełniacz! Jest **kot** → Nie ma **kota**.",
          "**Znam język** (B) → **Nie znam języka** (D). język → języka (dopełniacz po negacji)."
        ],
        counterExamplesUk: [
          "❌ **Nie mam czas** → ✅ **Nie mam czasu** (родовий!)",
          "❌ **Nie lubię kawa** → ✅ **Nie lubię kawy** (kawy, не kawa)",
          "❌ **Nie jest kot** → ✅ **Nie ma kota** (nie ma, не nie jest!)"
        ],
        counterExamplesPl: [
          "❌ **Nie mam czas** → ✅ **Nie mam czasu** (dopełniacz!)",
          "❌ **Nie lubię kawa** → ✅ **Nie lubię kawy** (kawy, nie kawa)",
          "❌ **Nie jest kot** → ✅ **Nie ma kota** (nie ma, nie nie jest!)"
        ],
        mnemonicUk: "🧠 **NIE + дієслово = Biernik → Dopełniacz**. Після 'nie' об'єкт стає родовим!",
        mnemonicPl: "🧠 **NIE + czasownik = Biernik → Dopełniacz**. Po 'nie' przedmiot staje się dopełniaczem!",
        difficulty: "A2",
        category: "syntax",
        relatedRules: ["cases-short"],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Доповни: 'Nie lubię ___' (кава)",
            questionPl: "Uzupełnij: 'Nie lubię ___' (kawa)",
            options: ["kawa", "kawę", "kawy", "kawie"],
            correctIndex: 2,
            explanationUk: "Після 'nie lubię' → родовий! kawę (B) → **kawy** (D)",
            explanationPl: "Po 'nie lubię' → dopełniacz! kawę (B) → **kawy** (D)"
          },
          {
            id: "q2",
            questionUk: "'Jest kot' → Заперечення?",
            questionPl: "'Jest kot' → Negacja?",
            options: ["Nie jest kot", "Nie ma kot", "Nie ma kota", "Nie kota"],
            correctIndex: 2,
            explanationUk: "**Nie ma** + родовий! Jest **kot** → Nie ma **kota**",
            explanationPl: "**Nie ma** + dopełniacz! Jest **kot** → Nie ma **kota**"
          },
          {
            id: "q3",
            questionUk: "Чому 'Nie mam czasu', а не 'czas'?",
            questionPl: "Dlaczego 'Nie mam czasu', a nie 'czas'?",
            options: ["Помилка в питанні", "Родовий після nie", "Знахідний після nie", "Орудний після nie"],
            correctIndex: 1,
            explanationUk: "Після **nie** знахідний → **родовий**! czas (B) → **czasu** (D)",
            explanationPl: "Po **nie** biernik → **dopełniacz**! czas (B) → **czasu** (D)"
          }
        ]
      },
      {
        id: "aspect",
        titleUk: "Вид дієслів",
        titlePl: "Aspekt",
        bodyUk:
          "Пара прикладів:\n- **robić** (недокон.) → процес\n- **zrobić** (докон.) → результат",
        bodyPl:
          "Para przykładów:\n- **robić** (niedokon.) → proces\n- **zrobić** (dokon.) → rezultat",
        detailedUk: "Аспект (вид) — найважливіша категорія польських дієслів. Майже кожне дієслово має ДВІ форми: **niedokonany** (процес, звичка, повтор) та **dokonany** (завершення, результат, одноразова дія). Вибір виду залежить від ХАРАКТЕРУ дії, а не від часу!",
        detailedPl: "Aspekt to najważniejsza kategoria polskich czasowników. Prawie każdy czasownik ma DWA formy: **niedokonany** (proces, nawyk, powtarzanie) i **dokonany** (ukończenie, rezultat, jednorazowa czynność). Wybór aspektu zależy od CHARAKTERU czynności, nie od czasu!",
        examplesUk: [
          "**Niedokonany**: Czytam książkę (читаю зараз, процес)",
          "**Dokonany**: Przeczytam książkę (прочитаю до кінця, результат)",
          "**Pary**: pisać/napisać, robić/zrobić, kupować/kupić",
          "**Nawyk** (недокон.): Codziennie **czytam** (щодня читаю)",
          "**Jednorazowa** (докон.): Wczoraj **przeczytałem** (вчора прочитав)"
        ],
        examplesPl: [
          "**Niedokonany**: Czytam książkę (czytam teraz, proces)",
          "**Dokonany**: Przeczytam książkę (przeczytam do końca, rezultat)",
          "**Pary**: pisać/napisać, robić/zrobić, kupować/kupić",
          "**Nawyk** (niedokonany): Codziennie **czytam** (czytam codziennie)",
          "**Jednorazowa** (dokonany): Wczoraj **przeczytałem** (wczoraj przeczytałem)"
        ],
        exampleExplanationsUk: [
          "**Czytam** (niedokonany) — ПРОЦЕС читання. Не важливо чи закінчу. Фокус на дії, що відбувається.",
          "**Przeczytam** (dokonany, префікс **prze-**) — РЕЗУЛЬТАТ. Прочитаю ДО КІНЦЯ. Фокус на завершенні.",
          "**Парний принцип**: недоконаний → **префікс** або **суфікс** → доконаний. robić → **z**robić, kupować → kupi**ć**.",
          "**Nawyk/powtór** → недоконаний. Codziennie **czytam** (щодня, багато разів). Звичка = процес!",
          "**Одноразова дія** → доконаний. Wczoraj **przeczytałem** (один раз, завершив). Результат важливий!"
        ],
        exampleExplanationsPl: [
          "**Czytam** (niedokonany) — PROCES czytania. Nieważne czy skończę. Fokus na czynności trwającej.",
          "**Przeczytam** (dokonany, prefiks **prze-**) — REZULTAT. Przeczytam DO KOŃCA. Fokus na ukończeniu.",
          "**Zasada par**: niedokonany → **prefiks** lub **sufiks** → dokonany. robić → **z**robić, kupować → kupi**ć**.",
          "**Nawyk/powtórzenie** → niedokonany. Codziennie **czytam** (codziennie, wiele razy). Nawyk = proces!",
          "**Jednorazowa czynność** → dokonany. Wczoraj **przeczytałem** (raz, ukończyłem). Rezultat ważny!"
        ],
        counterExamplesUk: [
          "❌ Teraz **zrobię** → ✅ Teraz **robię** (теперішній тільки недоконаний!)",
          "❌ Wczoraj **pisałem list** (одноразово) → ✅ **napisałem list** (завершив)",
          "❌ Jutro **robię** → ✅ **zrobię** (майбутнє = доконаний для результату)"
        ],
        counterExamplesPl: [
          "❌ Teraz **zrobię** → ✅ Teraz **robię** (teraźniejszy tylko niedokonany!)",
          "❌ Wczoraj **pisałem list** (jednorazowo) → ✅ **napisałem list** (ukończyłem)",
          "❌ Jutro **robię** → ✅ **zrobię** (przyszły = dokonany dla rezultatu)"
        ],
        mnemonicUk: "🧠 **Процес/Звичка = Niedokonany → Результат/Раз = Dokonany**. Теперішній = тільки niedokonany!",
        mnemonicPl: "🧠 **Proces/Nawyk = Niedokonany → Rezultat/Raz = Dokonany**. Teraźniejszy = tylko niedokonany!",
        difficulty: "A2",
        category: "verbs",
        relatedRules: ["present", "past"],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Який вид: 'Teraz czytam książkę'?",
            questionPl: "Jaki aspekt: 'Teraz czytam książkę'?",
            options: ["Niedokonany", "Dokonany", "Obydwa", "Żaden"],
            correctIndex: 0,
            explanationUk: "Теперішній час → тільки **niedokonany**! czytam = процес зараз",
            explanationPl: "Czas teraźniejszy → tylko **niedokonany**! czytam = proces teraz"
          },
          {
            id: "q2",
            questionUk: "'Wczoraj napisałem list' — чому dokonany?",
            questionPl: "'Wczoraj napisałem list' — dlaczego dokonany?",
            options: ["Минулий час", "Завершена дія", "Одне слово", "Помилка"],
            correctIndex: 1,
            explanationUk: "**Dokonany** = завершена дія! Написав І ЗАКІНЧИВ. Результат важливий.",
            explanationPl: "**Dokonany** = zakończona czynność! Napisałem I SKOŃCZYŁEM. Rezultat ważny."
          },
          {
            id: "q3",
            questionUk: "Звичка/повтор: 'Codziennie ___ kawę'",
            questionPl: "Nawyk/powtórzenie: 'Codziennie ___ kawę'",
            options: ["piję", "wypiję", "pił", "wypił"],
            correctIndex: 0,
            explanationUk: "Звичка → **niedokonany**! Codziennie **piję** (щодня, багато разів)",
            explanationPl: "Nawyk → **niedokonany**! Codziennie **piję** (codziennie, wiele razy)"
          }
        ]
      },
      {
        id: "future",
        titleUk: "Майбутній час",
        titlePl: "Czas przyszły",
        bodyUk: "Два способи: **доконаний** (zrobię) або **być + інфінітив** (będę robić).",
        bodyPl: "Dwa sposoby: **dokonany** (zrobię) lub **być + bezokolicznik** (będę robić).",
        detailedUk: "Майбутній час має ДВА варіанти: 1) **Доконаний вид** = проста форма (zrobię, напишу). 2) **będę + недоконаний інфінітив** = складена форма (będę robić, буду робити). Вибір залежить від виду дії!",
        detailedPl: "Czas przyszły ma DWA warianty: 1) **Aspekt dokonany** = forma prosta (zrobię, napiszę). 2) **być + bezokolicznik niedokonany** = forma złożona (będę robić). Wybór zależy od aspektu czynności!",
        examplesUk: [
          "**Dokonany** (проста форма): **Zrobię** to jutro (зроблю, результат)",
          "**Dokonany**: **Napiszę** list (напишу листа, завершу)",
          "**Niedokonany** (być + інфінітив): **Będę robić** (буду робити, процес)",
          "**Niedokonany**: **Będę pisać** (буду писати, без акценту на завершення)",
          "Відмінювання: będę, będziesz, będzie, będziemy, będziecie, będą"
        ],
        examplesPl: [
          "**Dokonany** (forma prosta): **Zrobię** to jutro (zrobię, rezultat)",
          "**Dokonany**: **Napiszę** list (napiszę list, ukończę)",
          "**Niedokonany** (być + bezokolicznik): **Będę robić** (będę robić, proces)",
          "**Niedokonany**: **Będę pisać** (będę pisać, bez akcentu na ukończenie)",
          "Odmiana: będę, będziesz, będzie, będziemy, będziecie, będą"
        ],
        exampleExplanationsUk: [
          "**Zrobię** (доконаний) = проста форма майбутнього. Акцент на РЕЗУЛЬТАТІ. Зроблю і завершу!",
          "**Napiszę** (доконаний) = напишу ДО КІНЦЯ. Префікс **na-** показує завершення.",
          "**Będę robić** (niedokonany) = складена форма. Акцент на ПРОЦЕСІ. Буду робити (але чи закінчу?).",
          "**Będę pisać** = буду писати. Процес важливіший за результат. Можливо, не завершу.",
          "**Відмінювання być**: będę (я), będziesz (ти), będzie (він/вона), będziemy (ми), będziecie (ви), będą (вони)"
        ],
        exampleExplanationsPl: [
          "**Zrobię** (dokonany) = forma prosta przyszłego. Akcent na REZULTACIE. Zrobię i ukończę!",
          "**Napiszę** (dokonany) = napiszę DO KOŃCA. Prefiks **na-** pokazuje ukończenie.",
          "**Będę robić** (niedokonany) = forma złożona. Akcent na PROCESIE. Będę robić (ale czy skończę?).",
          "**Będę pisać** = będę pisać. Proces ważniejszy niż rezultat. Możliwe, że nie skończę.",
          "**Odmiana być**: będę (ja), będziesz (ty), będzie (on/ona), będziemy (my), będziecie (wy), będą (oni)"
        ],
        counterExamplesUk: [
          "❌ **Będę zrobić** → ✅ **Zrobię** (доконаний = проста форма!)",
          "❌ **Robię jutro** → ✅ **Będę robić** / **Zrobię** (майбутнє, не теперішнє)",
          "❌ **Będę napisać** → ✅ **Napiszę** (доконаний без być!)"
        ],
        counterExamplesPl: [
          "❌ **Będę zrobić** → ✅ **Zrobię** (dokonany = forma prosta!)",
          "❌ **Robię jutro** → ✅ **Będę robić** / **Zrobię** (przyszły, nie teraźniejszy)",
          "❌ **Będę napisać** → ✅ **Napiszę** (dokonany bez być!)"
        ],
        mnemonicUk: "🧠 **Dokonany = prosta (zrobię) → Niedokonany = być + інфінітив (będę robić)**",
        mnemonicPl: "🧠 **Dokonany = prosta (zrobię) → Niedokonany = być + bezokolicznik (będę robić)**",
        difficulty: "A2",
        category: "verbs",
        relatedRules: ["present", "past", "aspect"],
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Майбутнє від dokonany 'napisać': Jutro ___ list",
            questionPl: "Przyszły od dokonany 'napisać': Jutro ___ list",
            options: ["będę napisać", "napiszę", "piszę", "będę pisać"],
            correctIndex: 1,
            explanationUk: "Доконаний → проста форма! Jutro **napiszę** list (напишу, результат)",
            explanationPl: "Dokonany → forma prosta! Jutro **napiszę** list"
          },
          {
            id: "q2",
            questionUk: "Майбутнє від niedokonany 'robić': Jutro ___ to",
            questionPl: "Przyszły od niedokonany 'robić': Jutro ___ to",
            options: ["zrobię", "będę robić", "robię", "będę zrobić"],
            correctIndex: 1,
            explanationUk: "Недоконаний → być + інфінітив! Jutro **będę robić** (буду робити, процес)",
            explanationPl: "Niedokonany → być + bezokolicznik! Jutro **będę robić**"
          },
          {
            id: "q3",
            questionUk: "Помилка: 'Będę napisać'",
            questionPl: "Błąd: 'Będę napisać'",
            options: ["Правильно", "Треба 'napiszę'", "Треба 'piszę'", "Треба 'pisałem'"],
            correctIndex: 1,
            explanationUk: "❌ Доконаний НЕ вживається з być! ✅ **Napiszę** (проста форма)",
            explanationPl: "❌ Dokonany NIE używa być! ✅ **Napiszę** (forma prosta)"
          }
        ]
      },
      {
        id: "gender",
        titleUk: "Рід іменників",
        titlePl: "Rodzaj rzeczowników",
        bodyUk: "Три роди: **męski** (-∅, -a), **żeński** (-a), **nijaki** (-o, -e).",
        bodyPl: "Trzy rodzaje: **męski** (-∅, -a), **żeński** (-a), **nijaki** (-o, -e).",
        detailedUk: "Кожен іменник має рід: чоловічий, жіночий або середній. Рід визначає закінчення прикметників, дієслів минулого часу та відмінкові форми. Часто рід можна визначити за закінченням слова.",
        detailedPl: "Każdy rzeczownik ma rodzaj: męski, żeński lub nijaki. Rodzaj określa końcówki przymiotników, czasowników w czasie przeszłym i formy przypadków. Często rodzaj można określić po końcówce słowa.",
        examplesUk: [
          "**Męski** (приголосна або -a для осіб): **kot**, **stół**, **tata**",
          "**Żeński** (зазвичай -a): **kawa**, **książka**, **mama**",
          "**Nijaki** (зазвичай -o, -e, -ę): **okno**, **pole**, **imię**",
          "Вплив на прикметник: **dobry** kot (м), **dobra** kawa (ж), **dobre** okno (с)",
          "Вплив на минулий: **czytałem** (м), **czytałam** (ж), **czytało** (с)"
        ],
        examplesPl: [
          "**Męski** (spółgłoska lub -a dla osób): **kot**, **stół**, **tata**",
          "**Żeński** (zazwyczaj -a): **kawa**, **książka**, **mama**",
          "**Nijaki** (zazwyczaj -o, -e, -ę): **okno**, **pole**, **imię**",
          "Wpływ na przymiotnik: **dobry** kot (m), **dobra** kawa (ż), **dobre** okno (n)",
          "Wpływ na przeszły: **czytałem** (m), **czytałam** (ż), **czytało** (n)"
        ],
        difficulty: "A1",
        category: "other",
        quizQuestions: [
          {
            id: "q1",
            questionUk: "Який рід: 'kawa'?",
            questionPl: "Jaki rodzaj: 'kawa'?",
            options: ["Męski", "Żeński", "Nijaki"],
            correctIndex: 1,
            explanationUk: "Закінчення **-a** → зазвичай **żeński**! kawa (ж)",
            explanationPl: "Końcówka **-a** → zazwyczaj **żeński**! kawa"
          },
          {
            id: "q2",
            questionUk: "Який рід: 'okno'?",
            questionPl: "Jaki rodzaj: 'okno'?",
            options: ["Męski", "Żeński", "Nijaki"],
            correctIndex: 2,
            explanationUk: "Закінчення **-o** → **nijaki** (середній)! okno",
            explanationPl: "Końcówka **-o** → **nijaki**! okno"
          }
        ]
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
