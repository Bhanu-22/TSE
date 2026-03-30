export type TemplateTokens = Record<string, string>;

export interface TemplateConfig {
  rawHtml?: string;
  processedHtml?: string;
  uploadedFileName?: string;
  colors?: Record<string, string>;
}
