"use client";

import { RefObject } from "react";

interface TemplateSandboxPreviewProps {
  processedHtml?: string;
  isLoading: boolean;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  onFrameLoad?: () => void;
  onFrameError?: () => void;
}

export default function TemplateSandboxPreview({
  processedHtml,
  isLoading,
  iframeRef,
  onFrameLoad,
  onFrameError,
}: TemplateSandboxPreviewProps) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "800px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
      }}
    >
      {isLoading ? (
        <div
          style={{
            minHeight: "800px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b5563",
            fontSize: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#3b82f6",
                animation: "template-studio-spin 1s linear infinite",
              }}
            />
            <span>Loading template preview...</span>
          </div>
          <style>{`@keyframes template-studio-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !processedHtml ? (
        <div
          style={{
            minHeight: "800px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b5563",
            fontSize: "14px",
          }}
        >
          No template loaded
        </div>
      ) : (
        <iframe
          key={processedHtml}
          ref={iframeRef}
          title="Template Preview"
          srcDoc={processedHtml}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          style={{
            width: "100%",
            minHeight: "800px",
            height: "800px",
            backgroundColor: "#ffffff",
            border: "none",
            display: "block",
          }}
          onLoad={onFrameLoad}
          onError={onFrameError}
        />
      )}
    </div>
  );
}
