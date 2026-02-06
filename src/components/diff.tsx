import React from "react";

export type DiffToken = { type: "equal" | "add" | "del"; token: string };

function tokenize(text: string) {
  return String(text || "").split(/(\s+)/);
}

export function diffTokens(before: string, after: string): DiffToken[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "equal", token: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", token: a[i] });
      i += 1;
    } else {
      out.push({ type: "add", token: b[j] });
      j += 1;
    }
  }
  while (i < n) out.push({ type: "del", token: a[i++] });
  while (j < m) out.push({ type: "add", token: b[j++] });
  return out;
}

export function DiffView({ before, after }: { before: string; after: string }) {
  const tokens = diffTokens(before, after);
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
      {tokens.map((entry, idx) => {
        if (!entry.token) return null;
        if (/^\s+$/.test(entry.token)) {
          return <span key={`ws-${idx}`}>{entry.token}</span>;
        }
        const className =
          entry.type === "add"
            ? "bg-moss/15 text-moss"
            : entry.type === "del"
            ? "bg-terracotta/15 text-terracotta line-through"
            : "";
        return (
          <span key={`${entry.type}-${idx}`} className={className}>
            {entry.token}
          </span>
        );
      })}
    </div>
  );
}
