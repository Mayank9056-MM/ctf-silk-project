import { CaseIdentifier } from "@/components/auth/case-identifier";
import { DEFAULT_CASE_ID } from "@/lib/constants/case";

/** Reuses the existing auth-screen CaseIdentifier — the one place "CASE // {id}" renders, per that component's own doc comment. */
export function DashboardCaseMeta({ caseId = DEFAULT_CASE_ID }: { caseId?: string }) {
  return <CaseIdentifier caseId={caseId} variant="inline" />;
}