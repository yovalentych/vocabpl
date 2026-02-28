export interface LegalSection {
  title: string;
  lastUpdated: string;
  content: string;
}

export const legalContent = {
  uk: {
    terms: {
      title: "Умови використання",
      lastUpdated: "2024-02-01",
      content: "Умови використання сервісу Polish Vocab Studio..."
    },
    privacy: {
      title: "Політика конфіденційності",
      lastUpdated: "2024-02-01",
      content: "Ми цінуємо вашу конфіденційність..."
    },
    cookies: {
      title: "Політика cookies",
      lastUpdated: "2024-02-01",
      content: "Ми використовуємо cookies для покращення досвіду..."
    }
  },
  pl: {
    terms: {
      title: "Warunki użytkowania",
      lastUpdated: "2024-02-01",
      content: "Warunki korzystania z serwisu Polish Vocab Studio..."
    },
    privacy: {
      title: "Polityka prywatności",
      lastUpdated: "2024-02-01",
      content: "Cenimy Twoją prywatność..."
    },
    cookies: {
      title: "Polityka cookies",
      lastUpdated: "2024-02-01",
      content: "Używamy cookies w celu poprawy doświadczenia..."
    }
  }
};
