import { redirect } from "next/navigation";

export default function WorkbookRedirectPage() {
  // Redirect /workbook to /class/workbook for consistency
  redirect("/class/workbook");
}
