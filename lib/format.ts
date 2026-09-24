// Fixed locale + UTC so server and client render identical text (no hydration mismatch).
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function formatDate(d: Date): string {
  return dateFormat.format(d);
}
