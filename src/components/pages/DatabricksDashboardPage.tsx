"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../Layout";

const DASHBOARD_BASE_WIDTH = 1720;
const DASHBOARD_BASE_HEIGHT = 1280;
const DASHBOARD_FOOTER_CROP = 44;

export default function DatabricksDashboardPage() {
  const context = useAppContext();
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [availableWidth, setAvailableWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setAvailableWidth(node.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  const iframeScale =
    availableWidth > 0
      ? Math.min(1, availableWidth / DASHBOARD_BASE_WIDTH)
      : 1;

  const visibleHeight = Math.max(
    640,
    (DASHBOARD_BASE_HEIGHT - DASHBOARD_FOOTER_CROP) * iframeScale
  );

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
      <div
        ref={containerRef}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: "12px",
          width: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${DASHBOARD_BASE_WIDTH * iframeScale}px`,
            height: `${visibleHeight}px`,
            overflow: "hidden",
          }}
        >
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              title="Databricks Dashboard"
              scrolling="no"
              allow="fullscreen; clipboard-read; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads"
              style={{
                width: `${DASHBOARD_BASE_WIDTH}px`,
                height: `${DASHBOARD_BASE_HEIGHT}px`,
                border: "none",
                display: "block",
                overflow: "hidden",
                transform: `scale(${iframeScale})`,
                transformOrigin: "top left",
              }}
              onLoad={() => setIsIframeLoading(false)}
              onError={() => setIsIframeLoading(false)}
            />
          )}
        </div>
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
