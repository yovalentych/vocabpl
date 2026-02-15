import SentryTestClient from "@/components/SentryTestClient";

export const metadata = {
  title: "Sentry Test"
};

export default function SentryTestPage() {
  return (
    <div className="min-h-[70vh] px-4 pb-16 pt-10">
      <SentryTestClient />
    </div>
  );
}
