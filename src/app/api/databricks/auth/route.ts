import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { normalizeDatabricksUrl } from "../../../../utils/databricksUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabricksAuthRequest = {
  clientId?: string;
  clientSecret?: string;
  workspaceUrl?: string;
};

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (value: unknown, fallback: string): string => {
  if (!isRecord(value)) {
    return fallback;
  }

  const errorDescription = value.error_description;
  if (typeof errorDescription === "string" && errorDescription.trim() !== "") {
    return errorDescription;
  }

  const error = value.error;
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }

  const message = value.message;
  if (typeof message === "string" && message.trim() !== "") {
    return message;
  }

  return fallback;
};

export async function POST(request: NextRequest) {
  let body: DatabricksAuthRequest;

  try {
    body = (await request.json()) as DatabricksAuthRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const clientId = body.clientId?.trim() || "";
  const clientSecret = body.clientSecret?.trim() || "";
  const workspaceUrlRaw = body.workspaceUrl?.trim() || "";

  if (!clientId || !clientSecret || !workspaceUrlRaw) {
    return NextResponse.json(
      {
        success: false,
        error: "workspaceUrl, clientId, and clientSecret are required",
      },
      { status: 400 }
    );
  }

  const workspaceUrl = normalizeDatabricksUrl(workspaceUrlRaw);
  const tokenUrl = `${workspaceUrl}/oidc/v1/token`;

  const formBody = new URLSearchParams();
  formBody.set("grant_type", "client_credentials");
  formBody.set("client_id", clientId);
  formBody.set("client_secret", clientSecret);
  formBody.set("scope", "all-apis");

  let tokenResponse: Response;

  try {
    tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to reach Databricks token endpoint" },
      { status: 502 }
    );
  }

  const tokenJson = (await tokenResponse.json().catch(() => null)) as unknown;

  if (!tokenResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(tokenJson, "Databricks token request failed"),
      },
      { status: tokenResponse.status }
    );
  }

  const parsedToken = isRecord(tokenJson)
    ? (tokenJson as TokenResponse)
    : ({} as TokenResponse);

  if (
    typeof parsedToken.access_token !== "string" ||
    parsedToken.access_token.trim() === "" ||
    typeof parsedToken.expires_in !== "number"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Databricks token response missing access_token or expires_in",
      },
      { status: 500 }
    );
  }

  const meUrl = `${workspaceUrl}/api/2.0/preview/scim/v2/Me`;
  let meResponse: Response;

  try {
    meResponse = await fetch(meUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${parsedToken.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to validate Databricks session" },
      { status: 502 }
    );
  }

  const meJson = (await meResponse.json().catch(() => null)) as unknown;

  if (!meResponse.ok || !isRecord(meJson)) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(meJson, "Databricks session validation failed"),
      },
      { status: meResponse.ok ? 500 : meResponse.status }
    );
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: parsedToken.expires_in,
  };

  cookieStore.set("databricks_token", parsedToken.access_token, cookieOptions);
  cookieStore.set("databricks_workspace", workspaceUrl, cookieOptions);
  cookieStore.set("databricks_client_id", clientId, cookieOptions);
  cookieStore.set("databricks_client_secret", clientSecret, cookieOptions);

  return NextResponse.json({
    success: true,
    user: meJson,
  });
}
