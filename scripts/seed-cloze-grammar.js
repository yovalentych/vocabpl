const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "polish_vocab";

if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const exercises = [
  {
    type: "cloze",
    level: "B1",
    title: "Znać, wiedzieć, umieć",
    content: {
      items: [
        {
          text: "Czy wy ___, gdzie znajduje się dworzec?",
          gaps: [{ index: 0, answers: ["wiecie"] }]
        },
        {
          text: "Czy ty ___ język słowacki? A czy ___ mówić po polsku?",
          gaps: [
            { index: 0, answers: ["znasz"] },
            { index: 1, answers: ["umiesz"] }
          ]
        },
        {
          text: "Anna to mądra dziewczyna. ___ cztery języki obce, ___ świetnie gotować, ___ jeździć konno i ___ wielu ciekawych ludzi.",
          gaps: [
            { index: 0, answers: ["zna"] },
            { index: 1, answers: ["umie"] },
            { index: 2, answers: ["umie"] },
            { index: 3, answers: ["zna"] }
          ]
        },
        {
          text: "Teresa i Tomasz ___ wielu popularnych celebrytów, ale nie ___, kim jest Beata Kozidrak.",
          gaps: [
            { index: 0, answers: ["znają"] },
            { index: 1, answers: ["wiedzą"] }
          ]
        },
        {
          text: "Ja nie ___ dokąd idę, nie ___ drogi i nie ___ posługiwać się GPSem.",
          gaps: [
            { index: 0, answers: ["wiem"] },
            { index: 1, answers: ["znam"] },
            { index: 2, answers: ["umiem"] }
          ]
        },
        {
          text: "___, kim jest Marek Kowal, ___ go dobrze.",
          gaps: [
            { index: 0, answers: ["Wiem", "wiem"] },
            { index: 1, answers: ["znam"] }
          ]
        },
        {
          text: "My ___, co będzie na obiad, ale czekamy na mamę, bo sami nie ___ gotować.",
          gaps: [
            { index: 0, answers: ["wiemy"] },
            { index: 1, answers: ["umiemy"] }
          ]
        },
        {
          text: "Marta i Kuba ___ dużo o świecie, ___ język hiszpański i niemiecki, ___ jeździć na nartach.",
          gaps: [
            { index: 0, answers: ["wiedzą"] },
            { index: 1, answers: ["znają"] },
            { index: 2, answers: ["umieją"] }
          ]
        }
      ]
    },
    createdAt: new Date()
  },
  {
    type: "cloze",
    level: "B1",
    title: "Iść, chodzić, jechać, jeździć",
    content: {
      items: [
        {
          text: "Do szkoły często ja ___ tramwajem, ale dziś ___ pieszo.",
          gaps: [
            { index: 0, answers: ["jeżdżę"] },
            { index: 1, answers: ["idę"] }
          ]
        },
        {
          text: "Ty codziennie ___ samochodem do pracy.",
          gaps: [{ index: 0, answers: ["jeździsz"] }]
        },
        {
          text: "Czym Anna dziś ___ do domu?",
          gaps: [{ index: 0, answers: ["jedzie"] }]
        },
        {
          text: "Często my ___ do kina, jutro ___ na film 'Zwierzogród'.",
          gaps: [
            { index: 0, answers: ["chodzimy"] },
            { index: 1, answers: ["idziemy"] }
          ]
        },
        {
          text: "Adrian i Józef zawsze ___ autobusem, dlatego jestem zdziwiona widząc, że dziś ___ na piechotę.",
          gaps: [
            { index: 0, answers: ["jeżdżą"] },
            { index: 1, answers: ["idą"] }
          ]
        }
      ]
    },
    createdAt: new Date()
  },
  {
    type: "cloze",
    level: "B1",
    title: "Zaimki osobowe i dzierżawcze",
    content: {
      items: [
        {
          text: "Kocham ___, ___ i kocham ___, ale ___ nie znoszę!",
          gaps: [
            { index: 0, answers: ["cię", "ciebie"] },
            { index: 1, answers: ["ją"] },
            { index: 2, answers: ["go", "jego"] },
            { index: 3, answers: ["ich"] }
          ]
        },
        {
          text: "To jest ___ pies, a widziałam, jak ___ córka szła z ___ na spacer.",
          gaps: [
            { index: 0, answers: ["ich"] },
            { index: 1, answers: ["twoja"] },
            { index: 2, answers: ["nim"] }
          ]
        },
        {
          text: "Lubię ___, ale nie pójdę z ___ na dyskotekę, idę z ___ do kina.",
          gaps: [
            { index: 0, answers: ["was"] },
            { index: 1, answers: ["wami"] },
            { index: 2, answers: ["nią"] }
          ]
        },
        {
          text: "Wczoraj ___ nie spotkałam. Trochę martwię się o ___.",
          gaps: [
            { index: 0, answers: ["go", "jego"] },
            { index: 1, answers: ["niego", "nim"] }
          ]
        },
        {
          text: "___ kot jest ładniejszy niż ___ i ___.",
          gaps: [
            { index: 0, answers: ["jego"] },
            { index: 1, answers: ["jej"] },
            { index: 2, answers: ["nasz"] }
          ]
        },
        {
          text: "Z ___ zabawa zawsze jest dobra! ___ dom jest zawsze pełen gości.",
          gaps: [
            { index: 0, answers: ["nami"] },
            { index: 1, answers: ["nasz"] }
          ]
        },
        {
          text: "___ tata jest architektem, ___ mama jest ogrodnikiem, a ___ rodzice są bezrobotni.",
          gaps: [
            { index: 0, answers: ["twój"] },
            { index: 1, answers: ["twoja"] },
            { index: 2, answers: ["moi"] }
          ]
        },
        {
          text: "Gdzie jest ___ rodzina i ___ przyjaciele? Nie przyjechali z ___?",
          gaps: [
            { index: 0, answers: ["jej"] },
            { index: 1, answers: ["jego"] },
            { index: 2, answers: ["wami"] }
          ]
        },
        {
          text: "Nie lubię ___. Gardzę ___.",
          gaps: [
            { index: 0, answers: ["go", "jego"] },
            { index: 1, answers: ["nim"] }
          ]
        },
        {
          text: "___ dzieci są tak samo krnąbrne jak ___! Już nigdy nie pojedziemy ani z ___ ani z ___ na wakacje!",
          gaps: [
            { index: 0, answers: ["ich"] },
            { index: 1, answers: ["wasze"] },
            { index: 2, answers: ["wami"] },
            { index: 3, answers: ["nimi"] }
          ]
        }
      ]
    },
    createdAt: new Date()
  },
  {
    type: "cloze",
    level: "B1",
    title: "Odmiana czasowników – czas teraźniejszy",
    content: {
      items: [
        {
          text: "Ja dziś nic nie ___, tylko ___ wodę. ___ trochę oczyścić organizm.",
          gaps: [
            { index: 0, answers: ["jem"] },
            { index: 1, answers: ["piję"] },
            { index: 2, answers: ["chcę"] }
          ]
        },
        {
          text: "Oni to źle ___ i ___! Ja nic nie ___!",
          gaps: [
            { index: 0, answers: ["interpretują"] },
            { index: 1, answers: ["analizują"] },
            { index: 2, answers: ["rozumiem"] }
          ]
        },
        {
          text: "Przepraszam, czy ty ___ to zadanie i ___, o co chodzi? Ja ___ i nie ___, jak to rozwiązać.",
          gaps: [
            { index: 0, answers: ["rozumiesz"] },
            { index: 1, answers: ["wiesz"] },
            { index: 2, answers: ["czytam"] },
            { index: 3, answers: ["wiem"] }
          ]
        },
        {
          text: "Wy zawsze ___! W sobotę my ___ na dyskotekę, chodźcie z nami!",
          gaps: [
            { index: 0, answers: ["pracujecie"] },
            { index: 1, answers: ["idziemy"] }
          ]
        },
        {
          text: "Jadwiga dużo ___ mądrych książek, ale ___, gdy ktoś ___ ją, czy jest kujonką.",
          gaps: [
            { index: 0, answers: ["czyta"] },
            { index: 1, answers: ["protestuje"] },
            { index: 2, answers: ["pyta"] }
          ]
        },
        {
          text: "Baśka i Katarzyna dziś nie ___ do restauracji. ___ zmęczone, zostają w domu: Basia ___ telewizję, a Katarzyna ___ do egzaminu.",
          gaps: [
            { index: 0, answers: ["idą"] },
            { index: 1, answers: ["są"] },
            { index: 2, answers: ["ogląda"] },
            { index: 3, answers: ["uczy się"] }
          ]
        },
        {
          text: "Wy ___, że Joanna ___ zajęta i ___ dużo pracy, ale dziś my ___ się z nią.",
          gaps: [
            { index: 0, answers: ["mówicie"] },
            { index: 1, answers: ["jest"] },
            { index: 2, answers: ["ma"] },
            { index: 3, answers: ["widzimy"] }
          ]
        },
        {
          text: "Ja ___ biologię, chociaż bardziej ___ chemią. Tak samo Grzegorz – ___ matematykę, a razem ___ na zajęcia z mikroorganizmów.",
          gaps: [
            { index: 0, answers: ["studiuję"] },
            { index: 1, answers: ["interesuję się"] },
            { index: 2, answers: ["lubi"] },
            { index: 3, answers: ["chodzimy"] }
          ]
        },
        {
          text: "Ty bardzo niewyraźnie ___! Ani Łukasz ani ja nie ___ tego przeczytać!",
          gaps: [
            { index: 0, answers: ["piszesz"] },
            { index: 1, answers: ["możemy"] }
          ]
        },
        {
          text: "Wy ___ robić zakupy i dużo ___. Można powiedzieć, że wy ___ w konsumpcji.",
          gaps: [
            { index: 0, answers: ["lubicie"] },
            { index: 1, answers: ["jecie"] },
            { index: 2, answers: ["specjalizujecie się"] }
          ]
        },
        {
          text: "Grażyna ___, że to, co jej dzieci ___, nie ___ prawdziwe.",
          gaps: [
            { index: 0, answers: ["rozumie"] },
            { index: 1, answers: ["widzą"] },
            { index: 2, answers: ["jest"] }
          ]
        },
        {
          text: "Oni dobrze ___, gdzie są pieniądze. Ale i tak ich nie ___, ponieważ my ___ dobrą minę do złej gry.",
          gaps: [
            { index: 0, answers: ["wiedzą"] },
            { index: 1, answers: ["pytam"] },
            { index: 2, answers: ["robimy"] }
          ]
        },
        {
          text: "Czy ty ___ znalezieniem dobrej pracy, dlatego tak ___ do każdej możliwej firmy i ___ o możliwość zatrudnienia?",
          gaps: [
            { index: 0, answers: ["interesujesz się"] },
            { index: 1, answers: ["telefonujesz"] },
            { index: 2, answers: ["pytasz"] }
          ]
        },
        {
          text: "Ja ___ tym, że wy stale mnie ___.",
          gaps: [
            { index: 0, answers: ["stresuję się"] },
            { index: 1, answers: ["kontrolujecie"] }
          ]
        },
        {
          text: "My ___ jedno, a wy i tak to ___ po swojemu i ___ jakąś nową rzeczywistość.",
          gaps: [
            { index: 0, answers: ["mówimy"] },
            { index: 1, answers: ["interpretujecie"] },
            { index: 2, answers: ["kreujecie"] }
          ]
        },
        {
          text: "Andrzej i Elżbieta ___ znakomicie gotować – ___ w kuchni azjatyckiej.",
          gaps: [
            { index: 0, answers: ["umieją"] },
            { index: 1, answers: ["specjalizują się"] }
          ]
        },
        {
          text: "Helena dużo ___ po Francji, dlatego znakomicie ___ po francusku, ___ przyrządzać rozmaite francuskie potrawy i ___ wielu ciekawych obcokrajowców.",
          gaps: [
            { index: 0, answers: ["podróżuje"] },
            { index: 1, answers: ["mówi"] },
            { index: 2, answers: ["umie"] },
            { index: 3, answers: ["zna"] }
          ]
        },
        {
          text: "Czy wy ___ się tu zatrzymać czy może my ___ dalej?",
          gaps: [
            { index: 0, answers: ["chcecie"] },
            { index: 1, answers: ["idziemy"] }
          ]
        },
        {
          text: "Agata nie ___ Jarka, a on stale ___ i ___ ją.",
          gaps: [
            { index: 0, answers: ["rozumie"] },
            { index: 1, answers: ["pyta"] },
            { index: 2, answers: ["przeprasza"] }
          ]
        },
        {
          text: "Ja ___ dobrą sałatkę, taką samą, jak oni ___, i ___ dobre piwo – to samo, co wy ___, ale inne niż oni ___.",
          gaps: [
            { index: 0, answers: ["jem"] },
            { index: 1, answers: ["jedzą"] },
            { index: 2, answers: ["piję"] },
            { index: 3, answers: ["pijecie"] },
            { index: 4, answers: ["piją"] }
          ]
        }
      ]
    },
    createdAt: new Date()
  }
];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("exercise_materials");

  // Remove existing grammar exercises with these titles to avoid duplicates
  const titles = exercises.map(e => e.title);
  const removed = await col.deleteMany({ type: "cloze", title: { $in: titles } });
  if (removed.deletedCount > 0) {
    console.log(`Removed ${removed.deletedCount} existing exercise(s) with same titles`);
  }

  const result = await col.insertMany(exercises);
  console.log(`Inserted ${result.insertedCount} cloze exercises:`);
  exercises.forEach((ex, i) => {
    console.log(`  ${i + 1}. [${ex.level}] ${ex.title} (${ex.content.items.length} sentences)`);
  });

  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
