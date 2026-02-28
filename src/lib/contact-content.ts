export type ContactContent = {
  titlePl: string;
  titleUk: string;
  subtitlePl: string;
  subtitleUk: string;
  leadPl: string;
  leadUk: string;
  email: string;
  phone?: string;
  telegram?: string;
  notePl?: string;
  noteUk?: string;
};

export const defaultContactContent: ContactContent = {
  titlePl: "Kontakt",
  titleUk: "Контакти",
  subtitlePl: "Napisz do mnie, jeśli masz pytania lub pomysły.",
  subtitleUk: "Напиши мені, якщо маєш питання або ідеї.",
  leadPl:
    "Polish Vocab Studio rozwijam samodzielnie, więc każda wiadomość pomaga ulepszać projekt.",
  leadUk:
    "Polish Vocab Studio я розвиваю самостійно, тому кожне повідомлення допомагає покращувати проєкт.",
  email: "info@vocabpl.uno",
  phone: "",
  telegram: "",
  notePl: "Odpowiadam zwykle w ciągu 1-2 dni roboczych.",
  noteUk: "Відповідаю зазвичай протягом 1-2 робочих днів."
};
