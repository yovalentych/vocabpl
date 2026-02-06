const $ = (s) => document.querySelector(s);

const demoCard = $("#demoCard");
const demoShuffle = $("#demoShuffle");
const demoFrontText = $("#demoFrontText");
const demoBackText = $("#demoBackText");
const demoCount = $("#demoCount");

const loginBtn = $("#loginBtn");
const signupBtn = $("#signupBtn");
const loginBtn2 = $("#loginBtn2");
const ctaSignup = $("#ctaSignup");
const ctaSignup2 = $("#ctaSignup2");
const ctaDemo = $("#ctaDemo");

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");
const modalClose = $("#modalClose");
const modalPrimary = $("#modalPrimary");
const modalSecondary = $("#modalSecondary");

const langUk = $("#langUk");
const langPl = $("#langPl");

const STORAGE_LANG = "pvt_guest_lang_v1";

const DEMO = [
  { pl: "być", uk: "бути", pos: "verb" },
  { pl: "mieć", uk: "мати", pos: "verb" },
  { pl: "mówić", uk: "говорити", pos: "verb" },
  { pl: "szybko", uk: "швидко", pos: "adverb" },
  { pl: "dobrze", uk: "добре", pos: "adverb" },
  { pl: "zawsze", uk: "завжди", pos: "adverb" },
];

let demoIdx = 0;

const I18N = {
  uk: {
    title: "Polish Vocab Trainer",
    subtitle: "Вчимо польську швидко: слова, тести, прогрес",
    pill: "Гість • демо-доступ",
    h1: "Тренуй слова та проходь тести — збережемо твій прогрес після реєстрації",
    lead: "Дієслова + прислівники, флешкарти, квіз, список і тест з автоперевіркою та статистикою.",
    ctaSignup: "Зареєструватися (безкоштовно)",
    ctaDemo: "Спробувати демо",
    note: "У гостьовому режимі прогрес зберігається лише на цьому пристрої. Для синхронізації — акаунт.",
    login: "Увійти",
    signup: "Створити акаунт",
    demoTag: "Демо",
    demoHint: "Натисни, щоб перевернути",
    flipHint: "Click / Space = flip",
    flipBackHint: "Реєстрація = прогрес + статистика",
    shuffle: "Shuffle",
    f1t: "Флешкарти",
    f1d: "Клікай, перегортай, позначай “знаю”, перемішуй набір.",
    f2t: "Квіз",
    f2d: "4 варіанти відповіді, швидкий тренажер на закріплення.",
    f3t: "Список + пошук",
    f3d: "Фільтруй за фразою або перекладом. Помічай вивчене.",
    f4t: "Тест + статистика",
    f4d: "Автоперевірка, відсоток, історія спроб, список помилок.",
    ctaTitle: "Хочеш зберігати прогрес і бачити статистику на будь-якому пристрої?",
    ctaDesc: "Створи акаунт — і твої “знаю”, результати тестів та історія будуть синхронізовані.",
    modalDemoT: "Демо-режим",
    modalDemoB: "Це публічна сторінка. Можеш дати доступ до слів/тесту частково, а повний прогрес — після реєстрації."
  },
  pl: {
    title: "Polish Vocab Trainer",
    subtitle: "Ucz się polskiego szybko: słowa, testy, postęp",
    pill: "Gość • dostęp demo",
    h1: "Ćwicz słowa i rozwiązuj testy — zapisujemy postęp po rejestracji",
    lead: "Czasowniki + przysłówki, fiszki, quiz, lista i test z autosprawdzeniem oraz statystyką.",
    ctaSignup: "Zarejestruj się (za darmo)",
    ctaDemo: "Wypróbuj demo",
    note: "W trybie gościa postęp jest tylko na tym urządzeniu. Synchronizacja wymaga konta.",
    login: "Zaloguj się",
    signup: "Utwórz konto",
    demoTag: "Demo",
    demoHint: "Kliknij, aby odwrócić",
    flipHint: "Click / Space = flip",
    flipBackHint: "Rejestracja = postęp + statystyka",
    shuffle: "Losuj",
    f1t: "Fiszki",
    f1d: "Klikaj, odwracaj, oznaczaj „znam”, mieszaj zestaw.",
    f2t: "Quiz",
    f2d: "4 odpowiedzi, szybkie utrwalenie.",
    f3t: "Lista + wyszukiwarka",
    f3d: "Filtruj po haśle lub tłumaczeniu. Oznaczaj poznane.",
    f4t: "Test + statystyka",
    f4d: "Autosprawdzenie, %, historia prób, lista błędów.",
    ctaTitle: "Chcesz mieć postęp i statystykę na każdym urządzeniu?",
    ctaDesc: "Załóż konto — a „znam”, wyniki testów i historia będą synchronizowane.",
    modalDemoT: "Tryb demo",
    modalDemoB: "To publiczna strona. Możesz udostępnić część słów/testu, a pełny postęp — po rejestracji."
  }
};

function setLang(lang){
  localStorage.setItem(STORAGE_LANG, lang);

  langUk.setAttribute("aria-pressed", String(lang === "uk"));
  langPl.setAttribute("aria-pressed", String(lang === "pl"));

  document.documentElement.lang = lang === "pl" ? "pl" : "uk";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
  });
}

function openModal(title, body, primaryText="OK", onPrimary=null){
  modalTitle.textContent = title;
  modalBody.textContent = body;

  modalPrimary.textContent = primaryText;
  modalSecondary.textContent = "OK";

  modal.classList.remove("hidden");

  const close = () => modal.classList.add("hidden");

  const primaryHandler = () => {
    if (typeof onPrimary === "function") onPrimary();
    close();
  };

  modalPrimary.onclick = primaryHandler;
  modalSecondary.onclick = close;
  modalClose.onclick = close;

  modal.onclick = (e) => {
    if (e.target === modal) close();
  };
}

function toggleFlip(){
  demoCard.classList.toggle("flipped");
}

function renderDemo(){
  const item = DEMO[demoIdx];
  demoFrontText.textContent = item.pl;
  demoBackText.textContent = item.uk;
  demoCount.textContent = `${demoIdx+1} / ${DEMO.length}`;
}

function shuffleDemo(){
  demoIdx = Math.floor(Math.random() * DEMO.length);
  demoCard.classList.remove("flipped");
  renderDemo();
}

function goLogin(){
  window.location.href = "/login";
}

function goSignup(){
  window.location.href = "/register";
}

function showDemoInfo(){
  const lang = localStorage.getItem(STORAGE_LANG) || "uk";
  openModal(I18N[lang].modalDemoT, I18N[lang].modalDemoB, "OK");
}

demoCard.addEventListener("click", toggleFlip);
demoCard.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); toggleFlip(); }
});

demoShuffle.addEventListener("click", shuffleDemo);

loginBtn.addEventListener("click", goLogin);
loginBtn2.addEventListener("click", goLogin);
signupBtn.addEventListener("click", goSignup);
ctaSignup.addEventListener("click", goSignup);
ctaSignup2.addEventListener("click", goSignup);
ctaDemo.addEventListener("click", showDemoInfo);

langUk.addEventListener("click", () => setLang("uk"));
langPl.addEventListener("click", () => setLang("pl"));

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); toggleFlip(); }
  if (e.key?.toLowerCase() === "s") shuffleDemo();
});

(function boot(){
  const saved = localStorage.getItem(STORAGE_LANG);
  setLang(saved === "pl" ? "pl" : "uk");
  renderDemo();
})();
