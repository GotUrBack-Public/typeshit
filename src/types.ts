export type Mode = "LOCAL" | "DOMAIN";
export type Status = "PASS" | "FINDING" | "REVIEW_REQUIRED" | "BLOCKED" | "ERROR" | "CONFIRMED" | "NOT_REPRODUCIBLE" | "POTENTIAL";
export interface ResearchDocument {
  finding: string;
  file: string;
  content: string;
  steps: string[];
}
export interface CheckResult {
  finding: string;
  title: string;
  status: Status;
  detail: string;
  sourceFiles: string[];
}
export interface AuthorizationRecord {
  required: boolean;
  confirmed: boolean;
  answer: string | null;
  domain: string | null;
  confirmedAt: string | null;
}
export interface RunReport {
  tool: string;
  startedAt: string;
  finishedAt: string;
  mode: Mode;
  target: string;
  authorization: AuthorizationRecord;
  researchFiles: number;
  results: CheckResult[];
}