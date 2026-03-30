import { TemplateTokens } from "../../types/template";

const DASHBOARD_PLACEHOLDER = "{{TS_EMBED_DASHBOARD}}";

export function applyTokens(rawHtml: string, tokens: TemplateTokens): string {
  let nextHtml = rawHtml;

  if (tokens.dashboardUrl) {
    nextHtml = nextHtml.replaceAll(
      DASHBOARD_PLACEHOLDER,
      `<iframe src="${tokens.dashboardUrl}" width="100%" height="800px" style="border:none;"></iframe>`
    );
  }

  Object.entries(tokens).forEach(([key, value]) => {
    if (key === "dashboardUrl") {
      return;
    }

    nextHtml = nextHtml.replaceAll(`{{${key}}}`, value);
  });

  return nextHtml;
}
