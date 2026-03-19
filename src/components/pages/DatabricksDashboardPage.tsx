"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../Layout";

export default function DatabricksDashboardPage() {
  const context = useAppContext();
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const workspaceUrl = context.appConfig.databricks?.workspaceUrl?.trim() || "";
  const dashboardId = context.appConfig.databricks?.dashboardId?.trim() || "";
  const orgId = context.appConfig.databricks?.orgId?.trim() || "";
  const dashboardVersion =
    context.appConfig.databricks?.dashboardVersion === "v1"
      ? "dashboards"
      : "dashboardsv3";

  const iframeSrc = useMemo(() => {
    if (!workspaceUrl || !dashboardId) return "";
    const normalizedWorkspaceUrl = workspaceUrl.replace(/\/$/, "");
    const base = `${normalizedWorkspaceUrl}/embed/${dashboardVersion}/${dashboardId}`;
    return orgId ? `${base}?o=${orgId}` : base;
  }, [workspaceUrl, dashboardId, orgId, dashboardVersion]);

  useEffect(() => {
    if (!iframeSrc) return;
    setIsIframeLoading(true);
  }, [iframeSrc]);

  if (!workspaceUrl || !dashboardId) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#718096",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Dashboard not configured. Please provide dashboardId in the JSON
          config.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {iframeSrc && (
          <iframe
            src={iframeSrc}
            title="Databricks Dashboard"
            allow="fullscreen; clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads"
            style={{ width: "100%", height: "100%", border: "none" }}
            onLoad={() => setIsIframeLoading(false)}
            onError={() => setIsIframeLoading(false)}
          />
        )}
        {isIframeLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f7fafc",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #3182ce",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
