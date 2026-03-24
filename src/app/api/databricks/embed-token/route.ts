import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabricksTokenSuccess = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type DatabricksTokenError = {
  error?: string;
  error_description?: string;
  message?: string;
};

type DatabricksEmbedTokenRequest = {
  workspaceUrl?: string;
  dashboardId?: string;
  externalViewerId?: string;
  externalValue?: string;
};

type DatabricksTokenInfoResponse = {
  authorization_details?: unknown;
  [key: string]: unknown;
};

const normalizeDatabricksHost = (host: string): string => {
  const trimmed = host.trim().replace(/\/$/, "");
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const buildBasicAuthHeader = (clientId: string, clientSecret: string): string =>
  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const rawText = await response.text().catch(() => "");
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
};

const getErrorMessage = (
  data: unknown,
  fallback: string,
  status?: number
): string => {
  if (typeof data === "string" && data.trim() !== "") {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as DatabricksTokenError;
    if (typeof record.error_description === "string" && record.error_description) {
      return record.error_description;
    }
    if (typeof record.error === "string" && record.error) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message) {
      return record.message;
    }
  }

  if (status) {
    return `${fallback} (${status})`;
  }

  return fallback;
};

const requestOidcToken = async (args: {
  host: string;
  clientId: string;
  clientSecret: string;
  params: URLSearchParams;
}): Promise<DatabricksTokenSuccess> => {
  const response = await fetch(`${args.host}/oidc/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: buildBasicAuthHeader(args.clientId, args.clientSecret),
    },
    body: args.params,
    cache: "no-store",
  });

  const data = (await parseJsonResponse(response)) as unknown;
  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Databricks token request failed", response.status)
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("Databricks token response was empty");
  }

  return data as DatabricksTokenSuccess;
};

export async function POST(request: NextRequest) {
  let body: DatabricksEmbedTokenRequest;

  try {
    body = (await request.json()) as DatabricksEmbedTokenRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const workspaceUrlFromCookie =
    request.cookies.get("databricks_workspace")?.value?.trim() || "";
  const clientIdFromCookie =
    request.cookies.get("databricks_client_id")?.value?.trim() || "";
  const clientSecretFromCookie =
    request.cookies.get("databricks_client_secret")?.value?.trim() || "";
  const workspaceUrlRaw =
    body.workspaceUrl?.trim() ||
    workspaceUrlFromCookie ||
    process.env.DATABRICKS_HOST;
  const dashboardId = body.dashboardId?.trim() || "";
  const externalViewerId = body.externalViewerId?.trim() || "";
  const externalValue = body.externalValue?.trim() || externalViewerId;
  const clientId =
    clientIdFromCookie ||
    process.env.DATABRICKS_CLIENT_ID?.trim() ||
    process.env.DATABRICKS_SERVICE_PRINCIPAL_ID?.trim() ||
    "";
  const clientSecret =
    clientSecretFromCookie ||
    process.env.DATABRICKS_CLIENT_SECRET?.trim() ||
    process.env.DATABRICKS_SERVICE_PRINCIPAL_SECRET?.trim() ||
    "";

  if (!workspaceUrlRaw) {
    return NextResponse.json(
      { error: "DATABRICKS_HOST not configured" },
      { status: 500 }
    );
  }
  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Databricks client ID is not available. Please log in again or configure DATABRICKS_CLIENT_ID.",
      },
      { status: 500 }
    );
  }
  if (!clientSecret) {
    return NextResponse.json(
      {
        error:
          "Databricks client secret is not available. Please log in again or configure DATABRICKS_CLIENT_SECRET.",
      },
      { status: 500 }
    );
  }
  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required to generate an embed token" },
      { status: 400 }
    );
  }
  if (!externalViewerId) {
    return NextResponse.json(
      { error: "externalViewerId is required to generate an embed token" },
      { status: 400 }
    );
  }

  const workspaceUrl = normalizeDatabricksHost(workspaceUrlRaw);

  try {
    const allApiTokenResponse = await requestOidcToken({
      host: workspaceUrl,
      clientId,
      clientSecret,
      params: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "all-apis",
      }),
    });

    if (!allApiTokenResponse.access_token) {
      throw new Error("Databricks token response missing access_token");
    }

    const tokenInfoUrl = new URL(
      `${workspaceUrl}/api/2.0/lakeview/dashboards/${encodeURIComponent(
        dashboardId
      )}/published/tokeninfo`
    );
    tokenInfoUrl.searchParams.set("external_viewer_id", externalViewerId);
    tokenInfoUrl.searchParams.set("external_value", externalValue);

    const tokenInfoResponse = await fetch(tokenInfoUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${allApiTokenResponse.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const tokenInfoData = (await parseJsonResponse(tokenInfoResponse)) as unknown;
    if (!tokenInfoResponse.ok) {
      throw new Error(
        getErrorMessage(
          tokenInfoData,
          "Databricks tokeninfo request failed",
          tokenInfoResponse.status
        )
      );
    }

    if (!tokenInfoData || typeof tokenInfoData !== "object") {
      throw new Error("Databricks tokeninfo response was empty");
    }

    const { authorization_details, ...rest } =
      tokenInfoData as DatabricksTokenInfoResponse;

    if (!authorization_details) {
      throw new Error(
        "Databricks tokeninfo response missing authorization_details"
      );
    }

    const scopedParams = new URLSearchParams({
      grant_type: "client_credentials",
      authorization_details: JSON.stringify(authorization_details),
    });

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        scopedParams.set(key, String(value));
      }
    });

    const scopedTokenResponse = await requestOidcToken({
      host: workspaceUrl,
      clientId,
      clientSecret,
      params: scopedParams,
    });

    if (!scopedTokenResponse.access_token || !scopedTokenResponse.token_type) {
      throw new Error(
        "Databricks scoped token response missing access_token or token_type"
      );
    }

    return NextResponse.json({
      access_token: scopedTokenResponse.access_token,
      token_type: scopedTokenResponse.token_type,
      expires_in: scopedTokenResponse.expires_in,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Databricks embed token",
      },
      { status: 500 }
    );
  }
}
