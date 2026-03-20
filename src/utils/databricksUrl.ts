export function normalizeDatabricksUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
