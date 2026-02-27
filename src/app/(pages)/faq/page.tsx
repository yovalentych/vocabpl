import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Question } from "@phosphor-icons/react/dist/ssr";
import StructuredData from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "FAQ — Часті питання про Polish Vocab Studio",
  description:
    "Відповіді на найпоширеніші питання про платформу Polish Vocab Studio: як працюють AI вправи, скільки коштує, які функції доступні, як вчити польську ефективно.",
  keywords: [
    "Polish Vocab Studio FAQ",
    "питання про навчання польської",
    "як вчити польську онлайн",
    "AI вправи польська FAQ",
    "ціни Polish Vocab Studio",
    "функції навчання польської"
  ],
  openGraph: {
    title: "FAQ — Часті питання",
    description: "Відповіді на найпоширеніші питання про навчання польської мови на платформі Polish Vocab Studio.",
    type: "website"
  }
};

const faqs = [
  {
    question: "Що таке Polish Vocab Studio?",
    answer:
      "Polish Vocab Studio — це онлайн платформа для вивчення польської мови з використанням AI технологій. Ми пропонуємо інтерактивний словник з 1500+ слів, AI-генеровані вправи (речення, переклад, діалоги, опис сцен), тести на знання граматики та читання польських текстів з перекладом."
  },
  {
    question: "Чи безкоштовна платформа?",
    answer:
      "Базові функції платформи доступні безкоштовно. Це включає доступ до словника, обмежену кількість AI вправ та тестів. Для повного доступу без обмежень доступна преміум підписка."
  },
  {
    question: "Як працюють AI вправи?",
    answer:
      'AI вправи генеруються автоматично на основі вашого рівня та теми, яку ви обираєте. Ви можете обрати тему (наприклад, "Подорож до Варшави"), рівень складності (A1-B2), та тип вправи (речення, діалоги, історії). Штучний інтелект створює унікальні завдання та перевіряє ваші відповіді з детальними поясненнями помилок.'
  },
  {
    question: "Які види вправ доступні?",
    answer:
      "На платформі доступні 8 типів вправ: складання речень (Sentences), переклад (Translate), парафраз (Paraphrase), заповнення пропусків (Cloze), зіставлення слів (Match), діалоги (Dialogue), мікроісторії (Story) та опис сцен (Describe). Кожна вправа має AI та класичний режими."
  },
  {
    question: "Що таке словник та тренажер слів?",
    answer:
      "Інтерактивний польсько-український словник містить 1500+ слів з транскрипцією, аудіо вимовою та прикладами. Словник включає дієслова, прикметники, видові пари, сленг та емоційні вирази. Тренажер дозволяє запам'ятовувати слова через flashcards, вибір варіантів або введення тексту."
  },
  {
    question: "Які рівні складності підтримуються?",
    answer:
      "Платформа підтримує рівні від A1 (початковий) до B2 (середньо-просунутий) згідно з Європейською шкалою CEFR. Ви можете обирати рівень для кожної вправи окремо, що дозволяє навчатися в комфортному темпі."
  },
  {
    question: "Чи можу я додавати власні слова?",
    answer:
      'Так! У розділі "Мої слова" ви можете створювати власний словник з польськими словами та їх перекладами. Це особливо корисно для запам\'ятовування лексики з ваших навчальних матеріалів або життєвих ситуацій.'
  },
  {
    question: "Що таке Compendium?",
    answer:
      "Compendium — це довідниковий розділ з 120+ граматичними правилами польської мови, цікавими фактами про Польщу, культурними особливостями та корисними навчальними ресурсами. Включає інтерактивні приклади та флешкартки для кращого засвоєння."
  },
  {
    question: "Чи можу я відстежувати свій прогрес?",
    answer:
      "Так, платформа автоматично відстежує ваш прогрес: кількість виконаних вправ, точність відповідей, вивчені слова, поточну серію днів навчання. Ви можете бачити статистику на головній сторінці та в розділі Cabinet."
  },
  {
    question: "Як часто оновлюється контент?",
    answer:
      "Ми регулярно додаємо нові слова в словник, граматичні правила в Compendium та покращуємо AI алгоритми для генерації вправ. Оновлення відбуваються щотижня."
  },
  {
    question: "Чи потрібне підключення до інтернету?",
    answer:
      "Так, для роботи платформи потрібне стабільне інтернет-з'єднання, оскільки AI вправи генеруються на серверах та потребують онлайн доступу до бази даних слів і граматичних правил."
  },
  {
    question: "Чи можу я використовувати платформу на мобільному?",
    answer:
      "Так! Polish Vocab Studio повністю адаптована для мобільних пристроїв (телефонів та планшетів). Ви можете вчитися в будь-який час та будь-де через браузер."
  },
  {
    question: "Як швидко я побачу результати?",
    answer:
      "Результати залежать від регулярності навчання. При щоденних заняттях по 20-30 хвилин ви помітите покращення словникового запасу вже через 2-3 тижні. Для відчутного прогресу в граматиці зазвичай потрібно 1-2 місяці регулярних вправ."
  },
  {
    question: "Чи можу я скасувати підписку?",
    answer:
      "Так, ви можете скасувати підписку в будь-який момент через налаштування акаунту. Після скасування доступ до преміум функцій збережеться до кінця оплаченого періоду."
  },
  {
    question: "Як зв'язатися з підтримкою?",
    answer:
      'Ви можете зв\'язатися з нами через сторінку "Контакти" або надіслати email. Ми відповідаємо протягом 24 годин в робочі дні.'
  }
];

function getFAQStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export default function FAQPage() {
  return (
    <>
      <StructuredData data={getFAQStructuredData()} />

      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          На головну
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-moss/20 bg-moss/10 px-4 py-2 mb-4">
            <Question size={20} weight="fill" className="text-moss" />
            <span className="text-xs font-semibold uppercase tracking-wider text-moss">
              Часті питання
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-ink mb-4">
            FAQ — Питання та відповіді
          </h1>

          <p className="text-lg text-ink/70 max-w-2xl mx-auto">
            Знайдіть відповіді на найпоширеніші питання про Polish Vocab Studio,
            навчання польської мови та функції платформи
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-soft transition-all hover:border-moss/30 hover:shadow-lg"
            >
              <summary className="flex cursor-pointer items-start gap-4 text-left font-semibold text-ink list-none">
                <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-moss/10 text-sm text-moss transition-colors group-open:bg-moss group-open:text-paper">
                  {index + 1}
                </span>
                <span className="flex-1 pt-1">{faq.question}</span>
                <svg
                  className="flex-shrink-0 mt-1.5 h-5 w-5 text-ink/40 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>

              <div className="mt-4 ml-12 text-ink/70 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 rounded-3xl border border-moss/20 bg-gradient-to-br from-moss/10 to-gold/10 p-8 text-center shadow-soft">
          <h2 className="text-2xl font-bold text-ink mb-3">
            Не знайшли відповідь?
          </h2>
          <p className="text-ink/70 mb-6">
            Напишіть нам, і ми з радістю допоможемо вам розібратися
          </p>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-paper transition hover:bg-moss/90"
          >
            Зв&apos;язатися з нами
          </Link>
        </div>
      </main>
    </>
  );
}
