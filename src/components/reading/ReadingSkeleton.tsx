export default function ReadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title Skeleton */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="h-4 w-16 rounded bg-ink/10"></div>
        <div className="mt-3 h-7 w-3/4 rounded bg-ink/10"></div>
        <div className="mt-2 h-4 w-1/2 rounded bg-ink/10"></div>
      </div>

      {/* Text Skeleton */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="h-3 w-12 rounded bg-ink/10"></div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-11/12 rounded bg-ink/10"></div>
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-10/12 rounded bg-ink/10"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-9/12 rounded bg-ink/10"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-3 w-12 rounded bg-ink/10"></div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-10/12 rounded bg-ink/10"></div>
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-11/12 rounded bg-ink/10"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-full rounded bg-ink/10"></div>
              <div className="h-4 w-8/12 rounded bg-ink/10"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
