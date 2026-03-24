import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clearDatabricksCookies = async () => {
  const cookieStore = await cookies();
  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  cookieStore.set("databricks_token", "", cookieOptions);
  cookieStore.set("databricks_workspace", "", cookieOptions);
  cookieStore.set("databricks_client_id", "", cookieOptions);
  cookieStore.set("databricks_client_secret", "", cookieOptions);
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("databricks_token")?.value || "";
  const workspaceUrl = cookieStore.get("databricks_workspace")?.value || "";

  if (!token || !workspaceUrl) {
    return NextResponse.json({ user: null });
  }

  let response: Response;

  try {
    response = await fetch(`${workspaceUrl}/api/2.0/preview/scim/v2/Me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ user: null });
  }

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok || !isRecord(data)) {
    await clearDatabricksCookies();
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: data });
}
