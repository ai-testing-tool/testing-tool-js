/** Pass/fail/skip counts for a launch. */
export interface Stats {
  passed: number;
  failed: number;
  skipped: number;
  blocked: number;
  invalid: number;
  muted: number;
  total: number;
}
