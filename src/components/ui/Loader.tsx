import clsx from "clsx";

interface LoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]"
} as const;

export default function Loader({ label, size = "sm", className }: LoaderProps) {
  return (
    <div className={clsx("flex items-center gap-3 text-ink/70", className)}>
      <span
        className={clsx(
          "inline-block animate-spin rounded-full border-ink/40 border-t-ink",
          sizeMap[size]
        )}
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
