import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import LessonSession from "@/components/lessons/LessonSession";

export const dynamic = "force-dynamic";

interface Props {
  params: { eventId: string };
  searchParams: { date?: string };
}

export default async function LessonPage({ params, searchParams }: Props) {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  const date = searchParams.date;
  if (!date) redirect("/");

  return (
    <LessonSession
      eventId={params.eventId}
      date={date}
      userId={auth.id}
      username={auth.username}
    />
  );
}
