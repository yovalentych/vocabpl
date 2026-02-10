import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function LeaderboardRedirectPage() {
  redirect("/class/leaderboard");
}
