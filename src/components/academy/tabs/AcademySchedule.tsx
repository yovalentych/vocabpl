"use client";

import PersonalScheduleClient from "@/components/PersonalScheduleClient";
import { useLocale } from "@/components/LocaleProvider";

export default function AcademySchedule() {
  const { locale } = useLocale();
  return <PersonalScheduleClient locale={locale} />;
}
