import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabricksTokenSuccess = {
  access_token: string;
  token_type: string;
};

type DatabricksTokenError = {
  error?: string;
  error_description?: string;
  message?: string;
};

const normalizeDatabricksHost = (host: string): string => {
  const trimmed = host.trim().replace(/\/$/, "");
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export async function GET() {
  const databricksHost = process.env.DATABRICKS_HOST;
  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;

  if (!databricksHost) {
    return NextResponse.json(
      { error: "DATABRICKS_HOST not configured" },
      { status: 500 }
    );
  }
  if (!clientId) {
    return NextResponse.json(
      { error: "DATABRICKS_CLIENT_ID not configured" },
      { status: 500 }
    );
  }
  if (!clientSecret) {
    return NextResponse.json(
      { error: "DATABRICKS_CLIENT_SECRET not configured" },
      { status: 500 }
    );
  }

  const normalizedHost = normalizeDatabricksHost(databricksHost);
  const tokenUrl = `${normalizedHost}/oidc/v1/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("scope", "all-apis");

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reach Databricks token endpoint",
      },
      { status: 500 }
    );
  }

  const rawText = await response.text().catch(() => "");
  const parsedJson = (() => {
    if (!rawText) return null;
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      return null;
    }
  })();

  if (!response.ok) {
    const errorData = (parsedJson || {}) as DatabricksTokenError;
    const message =
      errorData.error_description ||
      errorData.error ||
      errorData.message ||
      rawText ||
      `Databricks token request failed (${response.status})`;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const data = (parsedJson || {}) as DatabricksTokenSuccess;
  if (!data.access_token || !data.token_type) {
    return NextResponse.json(
      { error: "Databricks token response missing access_token or token_type" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: data.access_token,
    token_type: data.token_type,
  });
}
