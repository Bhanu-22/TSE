import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenResponse = {
  token?: string;
  access_token?: string;
  full_access_token?: string;
  fullAccessToken?: string;
  auth_token?: string;
  data?: {
    token?: string;
    access_token?: string;
    full_access_token?: string;
    fullAccessToken?: string;
    auth_token?: string;
  };
};

const extractToken = (data: unknown): string | null => {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return null;

  const response = data as TokenResponse;
  return (
    response.token ||
    response.access_token ||
    response.full_access_token ||
    response.fullAccessToken ||
    response.auth_token ||
    response.data?.token ||
    response.data?.access_token ||
    response.data?.full_access_token ||
    response.data?.fullAccessToken ||
    response.data?.auth_token ||
    null
  );
};

export async function POST() {
  const host =
    process.env.THOUGHTSPOT_HOST || "https://7dxperts.thoughtspot.cloud";
  const username = process.env.THOUGHTSPOT_USERNAME;
  const password = process.env.THOUGHTSPOT_PASSWORD;
  const orgIdentifier = process.env.THOUGHTSPOT_ORG;
  const endpoint =
    process.env.THOUGHTSPOT_TOKEN_ENDPOINT ||
    (host ? `${host.replace(/\/$/, "")}/api/rest/2.0/auth/token/full` : "");

  if (!username || !password || !endpoint) {
    console.warn("[thoughtspot-token] Missing env vars", {
      hasHost: !!host,
      hasUsername: !!username,
      hasPassword: !!password,
      hasEndpoint: !!endpoint,
    });
    return NextResponse.json(
      {
        error:
          "Missing ThoughtSpot environment variables. Required: THOUGHTSPOT_USERNAME, THOUGHTSPOT_PASSWORD.",
      },
      { status: 500 }
    );
  }

  const payload: Record<string, string> = {
    username,
    password,
  };

  if (orgIdentifier) {
    payload.org_identifier = orgIdentifier;
  }

  try {
    console.log("[thoughtspot-token] Requesting token", {
      endpoint,
      hasOrg: !!orgIdentifier,
    });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    if (!response.ok) {
      console.error("[thoughtspot-token] Token request failed", {
        status: response.status,
        response: rawText,
      });
      return NextResponse.json(
        {
          error: `ThoughtSpot token request failed: ${response.status}`,
          details: rawText,
        },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("[thoughtspot-token] Non-JSON response received", {
        contentType,
        preview: rawText.slice(0, 200),
      });
      return NextResponse.json(
        {
          error: "ThoughtSpot token response was not JSON",
          details: rawText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const token = extractToken(parsed);
    if (!token) {
      console.error("[thoughtspot-token] Token missing in response", {
        response: parsed,
      });
      return NextResponse.json(
        {
          error: "ThoughtSpot token response missing token",
          details: parsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[thoughtspot-token] Token request error", error);
    return NextResponse.json(
      {
        error: "Failed to reach ThoughtSpot token endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
