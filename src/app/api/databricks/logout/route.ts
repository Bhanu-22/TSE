import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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

  return NextResponse.json({ success: true });
}
