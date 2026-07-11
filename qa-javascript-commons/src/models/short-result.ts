/** Compact result row for launch lists and summaries. */
export interface ShortResult {
  id: string;
  title: string;
  status: string;
  duration: number;
  thread: string | null;
}
