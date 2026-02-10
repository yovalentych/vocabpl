import { cookies } from "next/headers";
import { dictionary, resolveLocale } from "@/lib/i18n";

export function getServerLocale() {
  const cookieStore = cookies();
  const locale = resolveLocale(cookieStore.get("locale")?.value);
  return locale;
}

export function getDictionary() {
  const locale = getServerLocale();
  return { locale, t: dictionary[locale] };
}
