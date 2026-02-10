import React from "react";

function inlineFormat(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderSimpleMarkdown(text: string) {
  const lines = String(text || "").split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  function flushList() {
    if (!list.length) return;
    blocks.push(
      <ul key={`list-${key++}`} className="ml-5 list-disc space-y-1 text-sm text-ink/80">
        {list.map((item, idx) => (
          <li key={`li-${idx}`} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </ul>
    );
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      list.push(trimmed.slice(2));
      continue;
    }
    flushList();
    if (!trimmed) {
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
      continue;
    }
    blocks.push(
      <p
        key={`p-${key++}`}
        className="text-sm text-ink/80"
        dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
      />
    );
  }
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}
