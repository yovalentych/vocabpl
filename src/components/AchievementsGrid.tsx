"use client";

import AchievementBadge from "@/components/AchievementBadge";
import type { AchievementProgress } from "@/lib/achievements";

export default function AchievementsGrid({
  achievements
}: {
  achievements: AchievementProgress[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {achievements.map((achievement) => {
        const percent = achievement.target > 0
          ? Math.round((achievement.progress / achievement.target) * 100)
          : achievement.unlocked ? 100 : 0;

        return (
          <div
            key={achievement.id}
            className={`rounded-2xl border p-4 shadow-soft ${
              achievement.unlocked
                ? "border-moss/20 bg-moss/5"
                : "border-ink/10 bg-paper/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <AchievementBadge tone={achievement.tone} icon={achievement.icon} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{achievement.title}</p>
                  <span className="text-xs font-semibold text-ink/60">
                    {achievement.unlocked ? "Отримано" : `${achievement.progress}/${achievement.target}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/50">{achievement.desc}</p>
                <div className="mt-3 h-2 w-full rounded-full bg-ink/10">
                  <div
                    className={`h-2 rounded-full ${achievement.unlocked ? "bg-moss" : "bg-gold/70"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
