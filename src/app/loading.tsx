import Loader from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader label="Завантаження…" size="lg" />
    </div>
  );
}
