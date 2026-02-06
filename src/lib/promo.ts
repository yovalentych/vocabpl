import crypto from "crypto";

export type PromoDuration = 7 | 30 | 182 | 365 | null;

export function generatePromoCode(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function getExpiryDate(duration: PromoDuration) {
  if (!duration) return null;
  const date = new Date();
  date.setDate(date.getDate() + duration);
  return date;
}
