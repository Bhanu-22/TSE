import { DatabricksUser } from "../components/DatabricksAuthContext";

const SESSION_KEY = "databricks_user";

type DatabricksSessionResponse = {
  user?: DatabricksUser | null;
};

type DatabricksLoginResponse = {
  success: boolean;
  error?: string;
  user?: DatabricksUser;
};

export async function getCurrentDatabricksUser(): Promise<DatabricksUser | null> {
  try {
    const response = await fetch("/api/databricks/session", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as DatabricksSessionResponse;
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function loginToDatabricks(
  clientId: string,
  clientSecret: string,
  workspaceUrl: string
): Promise<DatabricksLoginResponse> {
  try {
    const response = await fetch("/api/databricks/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
        workspaceUrl,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | DatabricksLoginResponse
      | null;

    if (!response.ok) {
      return {
        success: false,
        error:
          data && typeof data.error === "string"
            ? data.error
            : "Databricks login failed",
      };
    }

    if (!data?.success || !data.user) {
      return {
        success: false,
        error: "Databricks login response missing user",
      };
    }

    return { success: true, user: data.user };
  } catch {
    return {
      success: false,
      error: "Unable to connect to Databricks. Please check your credentials.",
    };
  }
}

export async function logoutFromDatabricks(): Promise<void> {
  await fetch("/api/databricks/logout", {
    method: "POST",
    cache: "no-store",
  }).catch(() => undefined);

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // fail silently
  }
}
