export interface ContactContent {
  titleUk: string;
  titlePl: string;
  subtitleUk: string;
  subtitlePl: string;
  leadUk: string;
  leadPl: string;
  noteUk?: string;
  notePl?: string;
  email: string;
  phone?: string;
  telegram?: string;
  descriptionUk?: string;
  descriptionPl?: string;
}

export const defaultContactContent: ContactContent = {
  titleUk: "Контакти",
  titlePl: "Kontakt",
  subtitleUk: "Зв'язатися з нами",
  subtitlePl: "Skontaktuj się",
  leadUk: "Маєте питання? Напишіть нам",
  leadPl: "Masz pytania? Napisz do nas",
  email: "support@polishvocab.com",
  descriptionUk: "Зв'яжіться з нами для підтримки або співпраці",
  descriptionPl: "Skontaktuj się z nami w sprawie wsparcia lub współpracy"
};
