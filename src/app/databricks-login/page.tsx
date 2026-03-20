"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCardLayout from "../../components/AuthCardLayout";
import { DEFAULT_CONFIG } from "../../services/configurationService";
import { loginToDatabricks } from "../../services/databricksApi";
import { useAppContext } from "../../components/Layout";
import { useDatabricksAuth } from "../../components/DatabricksAuthContext";

export default function DatabricksLoginPage() {
  const router = useRouter();
  const { appConfig, updateAppConfig } = useAppContext();
  const { setDatabricksUser } = useDatabricksAuth();
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl =
    DEFAULT_CONFIG.stylingConfig.application.topBar.logoUrl || "/logo.png";
  const primaryButtonColor =
    DEFAULT_CONFIG.stylingConfig.embeddedContent.customCSS.variables?.[
      "--ts-var-button--primary-background"
    ] || "#32c256";

  useEffect(() => {
    setWorkspaceUrl(appConfig.databricks?.workspaceUrl || "");
  }, [appConfig.databricks?.workspaceUrl]);

  const handleSubmit = async () => {
    if (!workspaceUrl || !clientId || !clientSecret) {
      setError("Please enter workspace URL, client ID, and client secret");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await loginToDatabricks(
      clientId,
      clientSecret,
      workspaceUrl
    );

    setIsSubmitting(false);

    if (result.success && result.user) {
      updateAppConfig({
        ...appConfig,
        provider: "databricks",
        databricks: {
          workspaceUrl,
          dashboardId: appConfig.databricks?.dashboardId,
          genieSpaceId: appConfig.databricks?.genieSpaceId,
          orgId: appConfig.databricks?.orgId,
          dashboardVersion: appConfig.databricks?.dashboardVersion,
          embedMode: appConfig.databricks?.embedMode,
          useGenieApi: appConfig.databricks?.useGenieApi,
        },
      });
      setDatabricksUser(result.user);
      router.push("/");
      return;
    }

    setError(result.error || "Databricks login failed");
  };

  return (
    <AuthCardLayout backgroundColor={primaryButtonColor}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        <img
          src={logoUrl}
          alt="Application logo"
          style={{
            width: 110,
            height: 72,
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      </div>
      <h1 style={{ margin: "0 0 10px", color: "#515151", fontSize: "24px" }}>
        Connect to Databricks
      </h1>
      <p style={{ margin: "0 0 30px", color: "#A8A8A8", fontSize: "14px" }}>
        Please authenticate with Databricks to continue
      </p>

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "4px",
            color: "#92400e",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <input
          type="url"
          placeholder="https://your-workspace.azuredatabricks.net"
          value={workspaceUrl}
          onChange={(event) => setWorkspaceUrl(event.target.value)}
          style={{
            padding: "12px",
            border: "1px solid #cbd5e0",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        <input
          type="text"
          placeholder="Enter your Databricks Client ID"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          style={{
            padding: "12px",
            border: "1px solid #cbd5e0",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        <input
          type="password"
          placeholder="Enter your Databricks Client Secret"
          value={clientSecret}
          onChange={(event) => setClientSecret(event.target.value)}
          style={{
            padding: "12px",
            border: "1px solid #cbd5e0",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
          style={{
            padding: "12px 24px",
            backgroundColor: isSubmitting ? "#cbd5e0" : primaryButtonColor,
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {isSubmitting ? "Connecting..." : "Connect"}
        </button>
      </form>
    </AuthCardLayout>
  );
}
