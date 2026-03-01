import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import TemplatesLibrary from "@/components/classes/templates/TemplatesLibrary";

type Params = {
  locale: 'uk' | 'pl';
};

export default async function TemplatesPage({ params }: { params: Params }) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect(`/${params.locale}/login`);
  }

  // Only teachers and admins can access templates
  if (auth.role !== 'admin' && auth.role !== 'tutor') {
    redirect(`/${params.locale}/classes`);
  }

  return <TemplatesLibrary locale={params.locale} />;
}
