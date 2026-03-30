export function logInfo(action: string, data?: unknown): void {
  if (data === undefined) {
    console.log(`[TemplateStudio] ${action}`);
    return;
  }

  console.log(`[TemplateStudio] ${action}`, data);
}

export function logError(action: string, error: unknown): void {
  console.error(`[TemplateStudio] ${action}`, error);
}
