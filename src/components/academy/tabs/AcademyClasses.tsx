"use client";

import ClassesList from "@/components/classes/ClassesList";
import { useLocale } from "@/components/LocaleProvider";

interface Props {
  isTeacher: boolean;
}

export default function AcademyClasses({ isTeacher }: Props) {
  const { locale } = useLocale();
  return <ClassesList locale={locale} isTeacher={isTeacher} />;
}
