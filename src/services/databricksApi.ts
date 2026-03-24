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

type DatabricksEmbedTokenResponse = {
  access_token?: string;
  token_type?: string;
  error?: string;
};

type DatabricksEmbedTokenRequest = {
  workspaceUrl?: string;
  dashboardId: string;
  externalViewerId: string;
  externalValue?: string;
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

export function getDatabricksExternalViewerId(): string {
  const storageKey = "databricks_external_viewer_id";

  const createViewerId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  try {
    const existingValue = localStorage.getItem(storageKey);
    if (existingValue) {
      return existingValue;
    }

    const nextValue = createViewerId();
    localStorage.setItem(storageKey, nextValue);
    return nextValue;
  } catch {
    return createViewerId();
  }
}

export async function getDatabricksEmbedToken(
  request: DatabricksEmbedTokenRequest
): Promise<string> {
  try {
    const response = await fetch("/api/databricks/embed-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    });

    const data = (await response.json().catch(() => null)) as
      | DatabricksEmbedTokenResponse
      | null;

    if (!response.ok) {
      throw new Error(
        data && typeof data.error === "string"
          ? data.error
          : "Failed to get Databricks embed token"
      );
    }

    if (!data?.access_token) {
      throw new Error("Databricks embed token response missing access_token");
    }

    return data.access_token;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get Databricks embed token"
    );
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
