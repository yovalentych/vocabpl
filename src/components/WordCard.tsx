import { Word } from "@/lib/types";

export default function WordCard({
  word,
  reveal,
  placeholder
}: {
  word: Word;
  reveal: boolean;
  placeholder: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper/90 p-6 shadow-soft">
      <div className="absolute inset-0 opacity-30" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
            {word.type}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">
            {word.pl}
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            {reveal ? word.uk : placeholder}
          </p>
        </div>
      </div>
    </div>
  );
}
