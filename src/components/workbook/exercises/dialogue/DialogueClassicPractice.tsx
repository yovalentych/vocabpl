// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, User, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import DialogueResults from "./DialogueResults";

interface Turn {
  id: number;
  speaker: "system" | "user";
  text: string;
  userResponse?: string;
}

interface DialogueClassicPracticeProps {
  config: {
    scenario: string;
    level: "A1" | "A2" | "B1" | "B2";
  };
  onComplete: () => void;
}

// Static dialogue scenarios with gaps
const SCENARIOS: Record<string, Record<string, Turn[]>> = {
  shop: {
    A1: [
      { id: 1, speaker: "system", text: "Dzień dobry! W czym mogę pomóc?" },
      { id: 2, speaker: "user", text: "[Привітайтеся та скажіть що ви шукаєте]" },
      { id: 3, speaker: "system", text: "Oczywiście, proszę tutaj." },
      { id: 4, speaker: "user", text: "[Запитайте скільки це коштує]" },
      { id: 5, speaker: "system", text: "To kosztuje 50 złotych." },
      { id: 6, speaker: "user", text: "[Скажіть що візьмете це]" }
    ],
    A2: [
      { id: 1, speaker: "system", text: "Witam! Czy mogę w czymś pomóc?" },
      { id: 2, speaker: "user", text: "[Скажіть що шукаєте подарунок для друга]" },
      { id: 3, speaker: "system", text: "Rozumiem. Jakie ma zainteresowania?" },
      { id: 4, speaker: "user", text: "[Опишіть інтереси друга]" },
      { id: 5, speaker: "system", text: "Mam właśnie coś idealnego! Proszę spojrzeć." },
      { id: 6, speaker: "user", text: "[Запитайте чи можна примірити/подивитися]" }
    ],
    B1: [
      { id: 1, speaker: "system", text: "Dzień dobry! Czym się państwo interesuje?" },
      { id: 2, speaker: "user", text: "[Поясніть що шукаєте щось особливе та опишіть деталі]" },
      { id: 3, speaker: "system", text: "Rozumiem. Mamy różne opcje. Jakiego rozmiaru pan/pani szuka?" },
      { id: 4, speaker: "user", text: "[Вкажіть розмір та запитайте про наявність кольорів]" },
      { id: 5, speaker: "system", text: "Tak, mamy w trzech kolorach. Czy chce pan/pani przymierzyć?" },
      { id: 6, speaker: "user", text: "[Погодьтеся та запитайте де примірочна]" }
    ],
    B2: [
      { id: 1, speaker: "system", text: "Witam serdecznie! W czym mogę służyć?" },
      { id: 2, speaker: "user", text: "[Поясніть складну ситуацію: купували товар, але він виявився несправним]" },
      { id: 3, speaker: "system", text: "Bardzo mi przykro. Czy zachował pan/pani paragon?" },
      { id: 4, speaker: "user", text: "[Підтвердіть і запитайте про процедуру повернення або обміну]" },
      { id: 5, speaker: "system", text: "Oczywiście. Możemy wymienić na nowy lub zwrócić pieniądze." },
      { id: 6, speaker: "user", text: "[Виберіть варіант і поясніть чому]" }
    ]
  },
  restaurant: {
    A1: [
      { id: 1, speaker: "system", text: "Dzień dobry! Stolik dla ilu osób?" },
      { id: 2, speaker: "user", text: "[Скажіть для скількох осіб]" },
      { id: 3, speaker: "system", text: "Proszę tutaj. Oto menu." },
      { id: 4, speaker: "user", text: "[Замовте щось їсти та пити]" },
      { id: 5, speaker: "system", text: "Dobrze, za chwilę przyniosę." },
      { id: 6, speaker: "user", text: "[Подякуйте]" }
    ],
    A2: [
      { id: 1, speaker: "system", text: "Witam! Czy mają państwo rezerwację?" },
      { id: 2, speaker: "user", text: "[Скажіть що немає, запитайте чи є вільні столики]" },
      { id: 3, speaker: "system", text: "Oczywiście, proszę za mną. Co mogę podać do picia?" },
      { id: 4, speaker: "user", text: "[Замовте напої та запитайте про спеціальності дня]" },
      { id: 5, speaker: "system", text: "Dzisiaj polecam pierogi i żurek. Są wyśmienite!" },
      { id: 6, speaker: "user", text: "[Скажіть що візьмете ці страви]" }
    ],
    B1: [
      { id: 1, speaker: "system", text: "Dobry wieczór! Zapraszam. Stolik przy oknie będzie odpowiedni?" },
      { id: 2, speaker: "user", text: "[Погодьтеся та запитайте про сьогоднішнє меню]" },
      { id: 3, speaker: "system", text: "Mamy sezonowe dania z grzybami i nowe desery. Czy mogę polecić wino do kolacji?" },
      { id: 4, speaker: "user", text: "[Запитайте про рекомендації вина під конкретну страву]" },
      { id: 5, speaker: "system", text: "Do tego dania doskonale pasuje białe wino z naszej winnicy." },
      { id: 6, speaker: "user", text: "[Погодьтеся та уточніть чи є вегетаріанські опції]" }
    ],
    B2: [
      { id: 1, speaker: "system", text: "Witam państwa. Mam nadzieję, że wszystko było w porządku?" },
      { id: 2, speaker: "user", text: "[Поясніть що була проблема з якістю страви]" },
      { id: 3, speaker: "system", text: "Najmocniej przepraszam! To niedopuszczalne. Jak mogę to naprawić?" },
      { id: 4, speaker: "user", text: "[Запропонуйте rozwiązanie та wyraź swoje oczekiwania]" },
      { id: 5, speaker: "system", text: "Oczywiście, natychmiast przygotuję nowe danie. Poczęstunek ode mnie." },
      { id: 6, speaker: "user", text: "[Podziękuj i dodaj opinię o obsłudze]" }
    ]
  },
  station: {
    A1: [
      { id: 1, speaker: "system", text: "Dzień dobry. Słucham?" },
      { id: 2, speaker: "user", text: "[Скажіть куди хочете поїхати]" },
      { id: 3, speaker: "system", text: "Pociąg odjeżdża o 15:30 z peronu 3." },
      { id: 4, speaker: "user", text: "[Запитайте скільки коштує квиток]" },
      { id: 5, speaker: "system", text: "65 złotych, proszę. Dobrej podróży!" },
      { id: 6, speaker: "user", text: "[Подякуйте]" }
    ],
    A2: [
      { id: 1, speaker: "system", text: "Witam! W czym mogę pomóc?" },
      { id: 2, speaker: "user", text: "[Запитайте коли наступний потяг до певного міста]" },
      { id: 3, speaker: "system", text: "Następny pociąg jest za godzinę. Bezpośredni czy z przesiadką?" },
      { id: 4, speaker: "user", text: "[Скажіть що хочете без przesiadek]" },
      { id: 5, speaker: "system", text: "To będzie koszt 120 złotych. Czy chce pan/pani miejscówkę?" },
      { id: 6, speaker: "user", text: "[Погодьтеся та запитайте про знижку dla studentów]" }
    ],
    B1: [
      { id: 1, speaker: "system", text: "Dzień dobry! Jak mogę pomóc?" },
      { id: 2, speaker: "user", text: "[Поясніть що потрібні квитки туди і назад на конкретні дати]" },
      { id: 3, speaker: "system", text: "Sprawdzam... Czy preferuje pan/pani ranną czy popołudniową podróż?" },
      { id: 4, speaker: "user", text: "[Вкажіть preferencje oraz zapytaj o dostępność miejsc]" },
      { id: 5, speaker: "system", text: "Mamy wolne miejsca w obu opcjach. Przy oknie czy przy przejściu?" },
      { id: 6, speaker: "user", text: "[Wybierz i zapytaj czy można rezerwować przez internet]" }
    ],
    B2: [
      { id: 1, speaker: "system", text: "Witam. Czym mogę służyć?" },
      { id: 2, speaker: "user", text: "[Wyjaśnij skomplikowaną sytuację: spóźniłeś się na pociąg]" },
      { id: 3, speaker: "system", text: "Rozumiem. Niestety, ten bilet był jednorazowy. Czy chce pan/pani złożyć reklamację?" },
      { id: 4, speaker: "user", text: "[Zapytaj o procedurę i możliwość zwrotu lub wymiany biletu]" },
      { id: 5, speaker: "system", text: "Możemy spróbować wymienić na późniejszy pociąg z dopłatą." },
      { id: 6, speaker: "user", text: "[Negocjuj warunki lub poproś o kontakt do działu reklamacji]" }
    ]
  },
  hotel: {
    A1: [
      { id: 1, speaker: "system", text: "Dzień dobry! Witamy w hotelu." },
      { id: 2, speaker: "user", text: "[Скажіть що маєте резервацію]" },
      { id: 3, speaker: "system", text: "Nazwisko, proszę?" },
      { id: 4, speaker: "user", text: "[Назвіть ім&apos;я]" },
      { id: 5, speaker: "system", text: "Tak, pokój 305. Oto klucz. Śniadanie od 7 do 10." },
      { id: 6, speaker: "user", text: "[Подякуйте та запитайте де ліфт]" }
    ],
    A2: [
      { id: 1, speaker: "system", text: "Witamy! Rezerwacja na jakie nazwisko?" },
      { id: 2, speaker: "user", text: "[Podaj nazwisko i zapytaj o możliwość wcześniejszego zameldowania]" },
      { id: 3, speaker: "system", text: "Sprawdzam... Pokój będzie gotowy za godzinę. Czy mogę zaproponować kawę w lobby?" },
      { id: 4, speaker: "user", text: "[Przyjmij propozycję i zapytaj o WiFi]" },
      { id: 5, speaker: "system", text: "Hasło do WiFi jest na karcie w pokoju. Czy potrzebuje pan/pani pomocy z bagażem?" },
      { id: 6, speaker: "user", text: "[Odpowiedz i zapytaj o atrakcje w okolicy]" }
    ],
    B1: [
      { id: 1, speaker: "system", text: "Dobry wieczór! Witamy w naszym hotelu. Czym mogę służyć?" },
      { id: 2, speaker: "user", text: "[Wyjaśnij że chcesz zmienić pokój na większy lub z innym widokiem]" },
      { id: 3, speaker: "system", text: "Oczywiście. Mamy dostępny pokój z widokiem na park. Czy to będzie odpowiednie?" },
      { id: 4, speaker: "user", text: "[Zapytaj o różnicę w cenie i udogodnienia]" },
      { id: 5, speaker: "system", text: "Dopłata to 100 złotych za noc. Pokój ma balkon i minibar." },
      { id: 6, speaker: "user", text: "[Podejmij decyzję i zapytaj o późniejszy wymeldowanie]" }
    ],
    B2: [
      { id: 1, speaker: "system", text: "Witam serdecznie. W czym mogę pomóc?" },
      { id: 2, speaker: "user", text: "[Złóż skargę na warunki w pokoju: brak ciepłej wody, hałas]" },
      { id: 3, speaker: "system", text: "Bardzo mi przykro z tego powodu. To niedopuszczalne. Jak mogę to naprawić?" },
      { id: 4, speaker: "user", text: "[Przedstaw swoje oczekiwania i możliwe rozwiązania]" },
      { id: 5, speaker: "system", text: "Natychmiast przeniesiemy państwa do apartamentu bez dodatkowych opłat i zwrócimy pierwszą noc." },
      { id: 6, speaker: "user", text: "[Ustosunkuj się do oferty i zapytaj o dodatkowe rekompensaty]" }
    ]
  },
  doctor: {
    A1: [
      { id: 1, speaker: "system", text: "Dzień dobry. Co pana/panią boli?" },
      { id: 2, speaker: "user", text: "[Скажіть що в вас болить]" },
      { id: 3, speaker: "system", text: "Od kiedy pan/pani to czuje?" },
      { id: 4, speaker: "user", text: "[Скажіть від коли]" },
      { id: 5, speaker: "system", text: "Rozumiem. Przepiszę leki. Proszę brać rano i wieczorem." },
      { id: 6, speaker: "user", text: "[Podякуйте]" }
    ],
    A2: [
      { id: 1, speaker: "system", text: "Witam. Jakie są objawy?" },
      { id: 2, speaker: "user", text: "[Opisz kilka symptomów: gorączka, kaszel, ból głowy]" },
      { id: 3, speaker: "system", text: "Czy miał pan/pani kontakt z chorymi osobami?" },
      { id: 4, speaker: "user", text: "[Odpowiedz i zapytaj czy to poważne]" },
      { id: 5, speaker: "system", text: "To najprawdopodobniej przeziębienie. Przepisam leki i zwolnienie." },
      { id: 6, speaker: "user", text: "[Zapytaj jak długo brać leki]" }
    ],
    B1: [
      { id: 1, speaker: "system", text: "Dzień dobry. Proszę opowiedzieć, co się dzieje." },
      { id: 2, speaker: "user", text: "[Opisz szczegółowo objawy i ich częstotliwość]" },
      { id: 3, speaker: "system", text: "Rozumiem. Czy bierze pan/pani jakieś leki na stałe?" },
      { id: 4, speaker: "user", text: "[Odpowiedz o lekach i zapytaj o możliwe przyczyny]" },
      { id: 5, speaker: "system", text: "To może być związane z dietą lub stresem. Polecam badania." },
      { id: 6, speaker: "user", text: "[Zapytaj jakie badania i gdzie można je zrobić]" }
    ],
    B2: [
      { id: 1, speaker: "system", text: "Dzień dobry. Widzę, że ma pan/pani wyniki badań. Omówmy je." },
      { id: 2, speaker: "user", text: "[Wyraź obawy dotyczące wyników i zapytaj o interpretację]" },
      { id: 3, speaker: "system", text: "Pewne wskaźniki są podwyższone, ale to nie powód do paniki. Trzeba zmienić tryb życia." },
      { id: 4, speaker: "user", text: "[Zapytaj szczegółowo o zalecenia i czy potrzebne są leki]" },
      { id: 5, speaker: "system", text: "Dieta, aktywność fizyczna i redukcja stresu. Leki przepiszę tylko jeśli nie będzie poprawy." },
      { id: 6, speaker: "user", text: "[Zapytaj o dalsze monitorowanie i kiedy kolejna wizyta]" }
    ]
  }
};

export default function DialogueClassicPractice({ config, onComplete }: DialogueClassicPracticeProps) {
  const { t } = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProcessing = isCheckingAI || isSubmitting;

  useEffect(() => {
    // Load appropriate scenario
    const scenarioData = SCENARIOS[config.scenario]?.[config.level] || [];
    setTurns(scenarioData.map(turn => ({ ...turn, userResponse: "" })));
  }, [config.scenario, config.level]);

  const handleResponseChange = (turnId: number, value: string) => {
    setTurns(prev =>
      prev.map(turn =>
        turn.id === turnId ? { ...turn, userResponse: value } : turn
      )
    );
  };

  const handleCheckWithAI = async () => {
    const userTurns = turns.filter(t => t.speaker === "user");
    const filledResponses = userTurns.filter(t => t.userResponse?.trim()).length;

    if (filledResponses === 0) {
      setError(t.workbook.dialogueAtLeastOne);
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const dialogueContext = turns.map(t => ({
        speaker: t.speaker,
        text: t.speaker === "system" ? t.text : t.userResponse || ""
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mini_dialog_check",
          userInput: JSON.stringify({
            exerciseType: "dialogue",
            action: "check",
            scenario: config.scenario,
            level: config.level,
            dialogue: dialogueContext
          }),
          context: JSON.stringify({ uiLanguage: t.locale || "uk" })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? t.workbook.classicAiQuotaError
            : errorCode === "pvs_unavailable"
              ? t.workbook.classicAiPlanRequired
              : data?.error || t.workbook.classicAiError;
        setError(message);
        return;
      }

      const result = safeParseAIResponse(data?.text);

      if (!result) {
        setError(t.workbook.classicAiFormatError);
        return;
      }

      // Save points to database
      if (result?.overall?.score01 != null) {
        try {
          const userTurnCount = turns.filter(t => t.speaker === "user").length;
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "dialogue",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: userTurnCount, exercise: "dialogue" })
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

      // Show results
      setAiCheckResult(result);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to check with AI:", error);
      setError(t.workbook.classicCheckError);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const userTurns = turns.filter(t => t.speaker === "user");
    const filledResponses = userTurns.filter(t => t.userResponse?.trim()).length;

    if (filledResponses === 0) {
      setError(t.workbook.dialogueAtLeastOne);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "dialogue",
          scenario: config.scenario,
          level: config.level,
          turns: turns.map(t => ({
            speaker: t.speaker,
            prompt: t.text,
            response: t.userResponse || ""
          }))
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        setError(data?.error || t.workbook.classicSubmitError);
        return;
      }

      // Save minimal points for submission
      try {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "dialogue",
            points: calculatePoints({ score01: 0.5, level: config.level, itemCount: filledResponses, exercise: "dialogue" })
          })
        });
      } catch (err) {
        console.error("Failed to save points:", err);
      }

      setSuccessMessage(t.workbook.classicSubmitSuccess);
      setTimeout(() => onComplete(), 2000);
    } catch (error) {
      console.error("Failed to submit:", error);
      setError(t.workbook.classicSubmitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTurns = turns.filter(t => t.speaker === "user");
  const filledCount = userTurns.filter(t => t.userResponse?.trim()).length;
  const progress = userTurns.length > 0 ? (filledCount / userTurns.length) * 100 : 0;

  const scenarioLabels: Record<string, string> = {
    shop: t.workbook.dialogueShop,
    restaurant: t.workbook.dialogueRestaurant,
    station: t.workbook.dialogueStation,
    hotel: t.workbook.dialogueHotel,
    doctor: t.workbook.dialogueDoctor
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
                {t.workbook.classicMode}
              </p>
              <h2 className="text-2xl font-semibold text-ink">
                {scenarioLabels[config.scenario]} · {config.level}
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                {t.workbook.dialogueFillAnswers}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper p-3 text-center">
              <div className="text-lg font-bold text-gold">{filledCount}/{userTurns.length}</div>
              <div className="text-[10px] text-ink/60">{t.workbook.dialogueAnswersLabel}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dialogue */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft space-y-4">
          {turns.map((turn) => (
            <div key={turn.id}>
              {turn.speaker === "system" ? (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-moss/10">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-moss mb-1">{t.workbook.dialoguePartner}</p>
                    <div className="rounded-2xl border border-moss/20 bg-moss/5 px-4 py-3">
                      <p className="text-sm text-ink">{turn.text}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold/10">
                    <User size={20} weight="fill" className="text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gold mb-1">{t.workbook.dialogueClassicYou}</p>
                    <div className="rounded-2xl border border-ink/20 bg-paper p-3">
                      <p className="text-xs text-ink/60 mb-2">{turn.text}</p>
                      <textarea
                        value={turn.userResponse || ""}
                        onChange={(e) => handleResponseChange(turn.id, e.target.value)}
                        placeholder={t.workbook.dialogueClassicPlaceholder}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-xl border border-ink/20 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-gold/40 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-moss">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCheckWithAI}
              disabled={isProcessing || filledCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCheckingAI ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>{t.workbook.classicAiChecking}</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>{t.workbook.classicCheckWithAI}</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmitForReview}
              disabled={isProcessing || filledCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>{t.workbook.classicSubmitting}</span>
                </>
              ) : (
                <>
                  <PaperPlaneRight size={18} weight="fill" />
                  <span>{t.workbook.classicSubmitForReview}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-ink/50">
            {t.workbook.classicCheckHint}
          </p>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <DialogueResults
          results={{
            mode: "classic",
            scenario: config.scenario,
            level: config.level,
            totalTurns: userTurns.length,
            filledTurns: filledCount,
            qualityScore: aiCheckResult?.overall?.accuracy || (filledCount / userTurns.length),
            aiFeedback: aiCheckResult
          }}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
