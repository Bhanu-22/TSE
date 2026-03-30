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
    <div className="w-full min-h-[800px] rounded-xl overflow-hidden border bg-gray-50">
      {isLoading ? (
        <div className="flex min-h-[800px] items-center justify-center text-sm text-gray-600">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
            <span>Loading template preview...</span>
          </div>
        </div>
      ) : !processedHtml ? (
        <div className="flex min-h-[800px] items-center justify-center text-sm text-gray-600">
          No template loaded
        </div>
      ) : (
        <iframe
          key={processedHtml}
          ref={iframeRef}
          title="Template Preview"
          srcDoc={processedHtml}
          sandbox="allow-same-origin"
          className="w-full min-h-[800px] h-[800px] bg-white border-none block"
          onLoad={onFrameLoad}
          onError={onFrameError}
        />
      )}
    </div>
  );
}
