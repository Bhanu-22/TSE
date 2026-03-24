"use client";

import { DatabricksDashboard } from "@databricks/aibi-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../Layout";
import {
  getDatabricksEmbedToken,
  getDatabricksExternalViewerId,
} from "../../services/databricksApi";

const DASHBOARD_BASE_WIDTH = 1720;
const DASHBOARD_BASE_HEIGHT = 1280;
const DASHBOARD_FOOTER_CROP = 44;
const DASHBOARD_SCALE_BREAKPOINT = 1280;

export default function DatabricksDashboardPage() {
  const context = useAppContext();
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [embedToken, setEmbedToken] = useState("");
  const [fallbackIframeSrc, setFallbackIframeSrc] = useState("");
  const [iframeWarning, setIframeWarning] = useState<string | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const externalEmbedContainerRef = useRef<HTMLDivElement | null>(null);

  const workspaceUrl = context.appConfig.databricks?.workspaceUrl?.trim() || "";
  const dashboardId = context.appConfig.databricks?.dashboardId?.trim() || "";
  const orgId = context.appConfig.databricks?.orgId?.trim() || "";
  const dashboardVersion =
    context.appConfig.databricks?.dashboardVersion === "v1"
      ? "dashboards"
      : "dashboardsv3";
  const normalizedWorkspaceUrl = workspaceUrl.replace(/\/$/, "");

  const iframeSrc = useMemo(() => {
    if (!workspaceUrl || !dashboardId) return "";
    const base = `${normalizedWorkspaceUrl}/embed/${dashboardVersion}/${dashboardId}`;
    return orgId ? `${base}?o=${orgId}` : base;
  }, [normalizedWorkspaceUrl, dashboardId, orgId, dashboardVersion, workspaceUrl]);

  const loadEmbedToken = useCallback(async () => {
    const externalViewerId = getDatabricksExternalViewerId();
    return getDatabricksEmbedToken({
      workspaceUrl,
      dashboardId,
      externalViewerId,
      externalValue: externalViewerId,
    });
  }, [dashboardId, workspaceUrl]);

  useEffect(() => {
    if (!iframeSrc) return;
    setIsIframeLoading(true);
  }, [iframeSrc]);

  useEffect(() => {
    if (!iframeSrc) {
      setEmbedToken("");
      setFallbackIframeSrc("");
      setIframeWarning(null);
      setIsIframeLoading(false);
      return;
    }

    if (!orgId) {
      setEmbedToken("");
      setFallbackIframeSrc(iframeSrc);
      setIframeWarning(
        "Databricks orgId is not configured. Falling back to the standard dashboard embed."
      );
      return;
    }

    let isCancelled = false;
    setEmbedToken("");
    setFallbackIframeSrc("");
    setIframeWarning(null);
    setIsIframeLoading(true);

    const resolveDashboardToken = async () => {
      try {
        const token = await loadEmbedToken();
        if (isCancelled) return;
        setEmbedToken(token);
      } catch (error) {
        if (isCancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Failed to get Databricks embed token";
        setFallbackIframeSrc(iframeSrc);
        setIframeWarning(
          `Databricks external embed token could not be loaded. Falling back to the standard dashboard embed. ${message}`
        );
      }
    };

    void resolveDashboardToken();

    return () => {
      isCancelled = true;
    };
  }, [dashboardId, iframeSrc, loadEmbedToken, orgId]);

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

  useEffect(() => {
    const container = externalEmbedContainerRef.current;
    if (!container || !embedToken || !dashboardId || !normalizedWorkspaceUrl || !orgId) {
      return;
    }

    setIsIframeLoading(true);
    setIframeWarning(null);

    const dashboard = new DatabricksDashboard({
      workspaceId: orgId,
      instanceUrl: normalizedWorkspaceUrl,
      container,
      dashboardId,
      token: embedToken,
      getNewToken: loadEmbedToken,
      config: {
        version: 1,
        hideDatabricksLogo: true,
      },
    });

    let loadTimeoutId: number | undefined;
    let attachedIframe: HTMLIFrameElement | null = null;

    const markLoaded = () => setIsIframeLoading(false);

    try {
      dashboard.initialize();

      attachedIframe = container.querySelector("iframe");
      if (attachedIframe) {
        attachedIframe.addEventListener("load", markLoaded);
        attachedIframe.addEventListener("error", markLoaded);
      } else {
        markLoaded();
      }

      loadTimeoutId = window.setTimeout(markLoaded, 12000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize Databricks dashboard embed";
      setEmbedToken("");
      setFallbackIframeSrc(iframeSrc);
      setIframeWarning(
        `Databricks external embed could not be initialized. Falling back to the standard dashboard embed. ${message}`
      );
      markLoaded();
    }

    return () => {
      if (loadTimeoutId !== undefined) {
        window.clearTimeout(loadTimeoutId);
      }
      if (attachedIframe) {
        attachedIframe.removeEventListener("load", markLoaded);
        attachedIframe.removeEventListener("error", markLoaded);
      }
      container.innerHTML = "";
      dashboard.destroy();
    };
  }, [
    dashboardId,
    embedToken,
    iframeSrc,
    loadEmbedToken,
    normalizedWorkspaceUrl,
    orgId,
  ]);

  const dashboardVisibleBaseHeight = DASHBOARD_BASE_HEIGHT - DASHBOARD_FOOTER_CROP;
  const shouldScaleToWidth =
    Boolean(fallbackIframeSrc) &&
    availableWidth > 0 &&
    availableWidth < DASHBOARD_SCALE_BREAKPOINT;
  const iframeScale =
    shouldScaleToWidth && availableWidth > 0
      ? Math.min(1, availableWidth / DASHBOARD_BASE_WIDTH)
      : 1;
  const visibleHeight = shouldScaleToWidth
    ? dashboardVisibleBaseHeight * iframeScale
    : undefined;

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
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {iframeWarning ? (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            backgroundColor: "#fff7ed",
            border: "1px solid #fdba74",
            borderRadius: "8px",
            color: "#9a3412",
            fontSize: "14px",
          }}
        >
          {iframeWarning}
        </div>
      ) : null}
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
          display: "flex",
          justifyContent: shouldScaleToWidth ? "center" : "stretch",
          alignItems: "flex-start",
        }}
      >
        {embedToken ? (
          <div
            ref={externalEmbedContainerRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          />
        ) : null}
        {fallbackIframeSrc ? (
          <div
            style={{
              position: "relative",
              width: shouldScaleToWidth
                ? `${DASHBOARD_BASE_WIDTH * iframeScale}px`
                : "100%",
              height: shouldScaleToWidth ? `${visibleHeight}px` : "100%",
              overflow: "hidden",
              maxWidth: "100%",
              flex: shouldScaleToWidth ? undefined : 1,
              minHeight: 0,
            }}
          >
            <iframe
              src={fallbackIframeSrc}
              title="Databricks Dashboard"
              scrolling="no"
              allow="fullscreen; clipboard-read; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads"
              style={{
                width: shouldScaleToWidth ? `${DASHBOARD_BASE_WIDTH}px` : "100%",
                height: shouldScaleToWidth ? `${DASHBOARD_BASE_HEIGHT}px` : "100%",
                border: "none",
                display: "block",
                overflow: "hidden",
                transform: shouldScaleToWidth
                  ? `scale(${iframeScale})`
                  : undefined,
                transformOrigin: shouldScaleToWidth ? "top left" : undefined,
              }}
              onLoad={() => setIsIframeLoading(false)}
              onError={() => setIsIframeLoading(false)}
            />
          </div>
        ) : null}
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
