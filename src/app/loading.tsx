import Loader from "@/components/ui/Loader";
import { getDictionary } from "@/lib/i18n-server";

export default function Loading() {
  const { t } = getDictionary();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader label={t.metadata.loadingLabel} size="lg" />
    </div>
  );
}
