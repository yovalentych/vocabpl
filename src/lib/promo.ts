import crypto from "crypto";

export type PromoDuration = 7 | 30 | 182 | 365 | null;

export type PromoCodeType = "random" | "readable" | "memorable" | "custom";

export type PromoBenefit =
  | "premium_access"      // Доступ до Premium функцій
  | "ai_unlimited"        // Безлімітні AI кредити
  | "video_access"        // Доступ до відео
  | "workbook_access"     // Доступ до workbook
  | "priority_support"    // Пріоритетна підтримка
  | "custom_words";       // Кастомні слова

export interface PromoCodeConfig {
  type?: PromoCodeType;
  length?: number;
  prefix?: string;
  suffix?: string;
}

const READABLE_SEGMENTS = [
  "EASY", "FAST", "MEGA", "SUPER", "BEST", "STAR", "GOLD", "PLUS",
  "ALEX", "MIKE", "JOHN", "ANNA", "LISA", "KATE", "MARK", "PAUL"
];

const MEMORABLE_WORDS = [
  "APPLE", "BEACH", "CLOUD", "DREAM", "EAGLE", "FLAME", "GRACE", "HEART",
  "LIGHT", "MAGIC", "OCEAN", "PEARL", "QUEST", "RIVER", "SMILE", "TIGER"
];

export function generatePromoCode(config: PromoCodeConfig = {}): string {
  const { type = "random", length = 10, prefix = "", suffix = "" } = config;

  let code = "";

  switch (type) {
    case "random": {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i += 1) {
        code += chars[bytes[i] % chars.length];
      }
      break;
    }

    case "readable": {
      // Формат: PREFIX-XXXX-XXXX-SUFFIX
      const segmentLength = Math.floor(length / 2);
      const seg1 = READABLE_SEGMENTS[crypto.randomInt(0, READABLE_SEGMENTS.length)];
      const seg2 = crypto.randomInt(1000, 9999).toString();
      code = `${seg1}${seg2}`;
      break;
    }

    case "memorable": {
      // Формат: WORD1WORD2
      const word1 = MEMORABLE_WORDS[crypto.randomInt(0, MEMORABLE_WORDS.length)];
      const word2 = MEMORABLE_WORDS[crypto.randomInt(0, MEMORABLE_WORDS.length)];
      const num = crypto.randomInt(10, 99);
      code = `${word1}${word2}${num}`;
      break;
    }

    case "custom":
      // Для custom type код буде переданий ззовні
      code = "";
      break;
  }

  return `${prefix}${code}${suffix}`.toUpperCase();
}

export function getExpiryDate(duration: PromoDuration) {
  if (!duration) return null;
  const date = new Date();
  date.setDate(date.getDate() + duration);
  return date;
}

export function formatPromoCode(code: string): string {
  // Форматує промокод для відображення: ABC123XYZ -> ABC-123-XYZ
  if (code.length <= 4) return code;
  const parts = code.match(/.{1,4}/g) || [];
  return parts.join("-");
}
