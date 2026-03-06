"use client";

import PersonalScheduleClient from "@/components/PersonalScheduleClient";
import { useLocale } from "@/components/LocaleProvider";

interface Props {
  isTeacher?: boolean;
}

export default function AcademySchedule({ isTeacher = false }: Props) {
  const { locale } = useLocale();
  return <PersonalScheduleClient locale={locale} isTeacher={isTeacher} />;
}
