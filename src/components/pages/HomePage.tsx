"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../Layout";
import { HomePageConfig, StandardMenu, User } from "../../types/thoughtspot";
import ThoughtSpotEmbed from "../ThoughtSpotEmbed";
import { ThoughtSpotContent } from "../../types/thoughtspot";

interface HomePageProps {
  onConfigUpdate?: (config: HomePageConfig) => void;
}

export default function HomePage({ onConfigUpdate }: HomePageProps) {
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlContainerRef = useRef<HTMLDivElement>(null);
  const [processedHtml, setProcessedHtml] = useState<string | null>(null);
  const [kpiEmbeds, setKpiEmbeds] = useState<
    Array<{
      id: string;
      liveboardId: string;
      vizId: string;
      width: string;
      height: string;
    }>
  >([]);

  // Always call the hook to follow React rules
  const context = useAppContext();

  // Use context if available, otherwise fall back to props
  const homePageConfig: HomePageConfig = context?.homePageConfig || {
    type: "html",
    value: "",
  };

  const standardMenus: StandardMenu[] = context?.standardMenus || [];

  // Find the home menu configuration
  const homeMenu = standardMenus.find((m) => m.id === "home");

  // Map the homePageType to the appropriate type for rendering
  // Use homeMenu.homePageValue for the actual content, fallback to homePageConfig.value
  let mappedType = homePageConfig.type;
  let mappedValue = homeMenu?.homePageValue || homePageConfig.value;

  if (homeMenu?.homePageType === "iframe") {
    // For iframe, map to url type for external websites
    mappedType = "url";
    mappedValue =
      homeMenu?.homePageValue || homePageConfig.value || "https://example.com";
  } else if (homeMenu?.homePageType === "liveboard") {
    // For ThoughtSpot content, map to embed type
    mappedType = "embed";
    mappedValue = homeMenu?.homePageValue || homePageConfig.value;
  } else if (homeMenu?.homePageType === "answer") {
    // For ThoughtSpot content, map to embed type
    mappedType = "embed";
    mappedValue = homeMenu?.homePageValue || homePageConfig.value;
  } else if (homeMenu?.homePageType === "spotter") {
    // For ThoughtSpot content, map to embed type
    mappedType = "embed";
    mappedValue = homeMenu?.homePageValue || homePageConfig.value;
  } else {
    // Default to html for other types
    mappedType = "html";
    mappedValue = homeMenu?.homePageValue || homePageConfig.value;
  }

  // Effect to handle image content
  useEffect(() => {
    // Use the mapped value for image content detection
    if (
      mappedValue &&
      (mappedValue.startsWith("indexeddb://") ||
        mappedValue.startsWith("data:image"))
    ) {
      // Handle image content
      if (mappedValue.startsWith("indexeddb://")) {
        // Load from IndexedDB
        const loadImageFromIndexedDB = async () => {
          try {
            const db = await window.indexedDB.open("ImageStorage", 1);

            // Handle database upgrade to ensure object store exists
            db.onupgradeneeded = (event) => {
              const database = (event.target as IDBOpenDBRequest).result;
              if (!database.objectStoreNames.contains("images")) {
                database.createObjectStore("images", { keyPath: "id" });
              }
            };

            db.onsuccess = (event) => {
              const database = (event.target as IDBOpenDBRequest).result;
              const transaction = database.transaction(["images"], "readonly");
              const objectStore = transaction.objectStore("images");
              const request = objectStore.get(
                mappedValue.replace("indexeddb://", "")
              );

              request.onsuccess = () => {
                if (request.result) {
                  setImageSrc(request.result.dataUrl);
                }
              };
            };

            db.onerror = () => {
              console.error("Failed to open ImageStorage database:", db.error);
            };
          } catch (error) {
            console.error("Error loading image from IndexedDB:", error);
          }
        };
        loadImageFromIndexedDB();
      } else {
        // Direct data URL
        setImageSrc(mappedValue);
      }
    } else {
      setImageSrc(null);
    }
  }, [mappedValue]);

  // Convert ThoughtSpot KPI iframes to SDK placeholders
  useEffect(() => {
    if (mappedType !== "html") {
      setProcessedHtml(null);
      setKpiEmbeds([]);
      return;
    }

    if (!mappedValue || !mappedValue.trim()) {
      setProcessedHtml(null);
      setKpiEmbeds([]);
      return;
    }

    // Only run in the browser
    if (typeof window === "undefined") {
      setProcessedHtml(mappedValue);
      setKpiEmbeds([]);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(mappedValue, "text/html");
      const embeds: Array<{
        id: string;
        liveboardId: string;
        vizId: string;
        width: string;
        height: string;
      }> = [];

      const iframes = Array.from(doc.querySelectorAll("iframe"));
      let embedIndex = 0;

      const readStyleValue = (style: string, property: string): string => {
        const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, "i");
        const match = style.match(regex);
        return match?.[1]?.trim() || "";
      };

      const extractIdsFromSrc = (src: string) => {
        try {
          const url = new URL(src);
          const hash = url.hash || "";
          const match = hash.match(/\/embed\/viz\/([^/]+)\/([^/?#]+)/);
          if (!match) return null;
          return { liveboardId: match[1], vizId: match[2] };
        } catch {
          const match = src.match(/#\/embed\/viz\/([^/]+)\/([^/?#]+)/);
          if (!match) return null;
          return { liveboardId: match[1], vizId: match[2] };
        }
      };

      iframes.forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (!src.includes("/embed/viz/")) return;

        const ids = extractIdsFromSrc(src);
        if (!ids) return;

        const style = iframe.getAttribute("style") || "";
        const widthFromStyle = readStyleValue(style, "width");
        const heightFromStyle = readStyleValue(style, "height");
        const width = iframe.getAttribute("width") || widthFromStyle || "100%";
        const height =
          iframe.getAttribute("height") || heightFromStyle || "400px";

        const embedId = `ts-kpi-${embedIndex++}`;
        embeds.push({
          id: embedId,
          liveboardId: ids.liveboardId,
          vizId: ids.vizId,
          width,
          height,
        });

        const placeholder = doc.createElement("div");
        placeholder.setAttribute("data-ts-embed-id", embedId);
        placeholder.setAttribute("data-ts-liveboard-id", ids.liveboardId);
        placeholder.setAttribute("data-ts-viz-id", ids.vizId);

        const hasWidthInStyle = /\bwidth\s*:/i.test(style);
        const hasHeightInStyle = /\bheight\s*:/i.test(style);
        const hasOverflowInStyle = /\boverflow\s*:/i.test(style);
        const hasRadiusInStyle = /\bborder-radius\s*:/i.test(style);

        let combinedStyle = style.trim();
        if (combinedStyle && !combinedStyle.endsWith(";")) {
          combinedStyle += ";";
        }
        if (!hasWidthInStyle) {
          combinedStyle += `width:${width};`;
        }
        if (!hasHeightInStyle) {
          combinedStyle += `height:${height};`;
        }
        // Preserve rounded corner look by clipping SDK content inside the card.
        if (hasRadiusInStyle && !hasOverflowInStyle) {
          combinedStyle += "overflow:hidden;";
        }

        placeholder.setAttribute("style", combinedStyle);
        placeholder.className = "ts-kpi-embed";

        iframe.replaceWith(placeholder);
      });

      // Preserve template-level styling from <head> so grid/cards/footer buttons keep original look.
      const preservedHeadMarkup = Array.from(
        doc.head.querySelectorAll(
          'style, link[rel="stylesheet"], link[rel="preconnect"], link[rel="dns-prefetch"]'
        )
      )
        .map((node) => node.outerHTML)
        .join("");

      setProcessedHtml(`${preservedHeadMarkup}${doc.body.innerHTML}`);
      setKpiEmbeds(embeds);
    } catch (error) {
      console.error("Failed to process KPI embeds:", error);
      setProcessedHtml(mappedValue);
      setKpiEmbeds([]);
    }
  }, [mappedType, mappedValue]);

  // Render KPI embeds via ThoughtSpot SDK after HTML is injected
  useEffect(() => {
    if (!kpiEmbeds.length) return;
    if (!htmlContainerRef.current) return;

    let isMounted = true;
    const instances: Array<{ destroy?: () => void }> = [];

    const initEmbeds = async () => {
      try {
        const { LiveboardEmbed, Action } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        // Get current user
        const currentUser = context.userConfig.users.find(
          (u: User) => u.id === context.userConfig.currentUserId
        );

        // Get hidden actions for current user
        const hiddenActionsStrings: string[] =
          currentUser?.access.hiddenActions?.enabled
            ? currentUser.access.hiddenActions.actions
            : [];

        const hiddenActions: Array<
          (typeof Action)[keyof typeof Action]
        > = [];
        hiddenActionsStrings.forEach((actionString: string) => {
          const actionKey = Object.keys(Action).find(
            (key) => Action[key as keyof typeof Action] === actionString
          );
          if (actionKey) {
            hiddenActions.push(Action[actionKey as keyof typeof Action]);
          }
        });

        const userLocale = currentUser?.locale || "en";
        const runtimeFilters = currentUser?.access.runtimeFilters || [];

        const embedFlags =
          context.stylingConfig.embedFlags?.liveboardEmbed || {};

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { visibleActions, ...filteredEmbedFlags } = embedFlags;

        const customCSS = context.stylingConfig.embeddedContent.customCSS;
        const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
        const strings = context.stylingConfig.embeddedContent.strings;
        const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

        for (const embed of kpiEmbeds) {
          if (!isMounted || !htmlContainerRef.current) return;

          const target = htmlContainerRef.current.querySelector(
            `[data-ts-embed-id="${embed.id}"]`
          ) as HTMLDivElement | null;
          if (!target) continue;

          const instance = new LiveboardEmbed(target, {
            liveboardId: embed.liveboardId,
            vizId: embed.vizId,
            frameParams: {
              width: embed.width,
              height: embed.height,
            },
            locale: userLocale,
            ...filteredEmbedFlags,
            ...(hiddenActions.length > 0 && { hiddenActions }),
            ...(runtimeFilters.length > 0 && { runtimeFilters }),
            customizations: {
              content: {
                strings: strings || {},
                stringIDs: stringIDs || {},
              },
              style: {
                customCSSUrl: cssUrl || undefined,
                customCSS: {
                  variables: customCSS.variables || {},
                  rules_UNSTABLE: customCSS.rules_UNSTABLE || {},
                },
              },
            },
          });

          instances.push(instance);
          await instance.render();
        }
      } catch (error) {
        console.error("Failed to render KPI embeds:", error);
      }
    };

    initEmbeds();

    return () => {
      isMounted = false;
      instances.forEach((instance) => {
        if (typeof instance.destroy === "function") {
          instance.destroy();
        }
      });
    };
  }, [
    kpiEmbeds,
    context.userConfig.currentUserId,
    context.userConfig.users,
    context.stylingConfig.embedFlags?.liveboardEmbed,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
  ]);

  // Effect to handle iframe errors
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIframeError(null);
    };

    const handleError = () => {
      setIframeError(
        "Failed to load the website. The website may not allow iframe embedding."
      );
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, [mappedValue]);

  // Additional cleanup effect for when content becomes empty
  useEffect(() => {
    if (!mappedValue || !mappedValue.trim()) {
      // Clear any iframe errors when content is empty
      setIframeError(null);
    }
  }, [mappedValue]);

  const renderContent = () => {
    // Check if this is image content based on the value
    if (
      imageSrc ||
      (homePageConfig.value &&
        (homePageConfig.value.startsWith("indexeddb://") ||
          homePageConfig.value.startsWith("data:image")))
    ) {
      if (imageSrc) {
        return (
          <div style={{ textAlign: "center" }}>
            <img
              src={imageSrc}
              alt="Uploaded content"
              style={{
                maxWidth: "100%",
                maxHeight: "600px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
        );
      }
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            border: "2px dashed #cbd5e0",
          }}
        >
          <p style={{ color: "#4a5568", margin: 0 }}>No image uploaded</p>
        </div>
      );
    }

    switch (mappedType) {
      case "html":
        if (mappedValue && mappedValue.trim()) {
          const htmlToRender = processedHtml ?? mappedValue;
          return (
            <div
              dangerouslySetInnerHTML={{ __html: htmlToRender }}
              className="Box-container"
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                height: "100%",
                overflow: "auto",
              }}
              ref={htmlContainerRef}
            />
          );
        }
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
              📝 HTML Content
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Configure HTML content in the settings to display custom content
              on your home page.
            </p>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                color: "#0369a1",
                fontSize: "14px",
              }}
            >
              <strong>💡 Tip:</strong> You can use HTML to create custom
              layouts, add instructions, or embed external content. For example:
              <pre
                style={{
                  margin: "12px 0 0 0",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "4px",
                  fontSize: "13px",
                  overflow: "auto",
                }}
              >
                {`<h1>Welcome to Your Liveboard</h1>
<p>This is a custom HTML section where you can:</p>
<ul>
  <li>Add company branding</li>
  <li>Include helpful instructions</li>
  <li>Create custom layouts</li>
  <li>Embed external widgets</li>
</ul>
<div style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
  <strong>Quick Start:</strong> Use the settings menu to configure your home page content.
</div>`}
              </pre>
            </div>
          </div>
        );

      case "url":
        const urlToDisplay = mappedValue || "https://example.com";

        // Prevent infinite loop by checking if the URL is the same as current app
        const currentOrigin = window.location.origin;
        const isSameApp = urlToDisplay.startsWith(currentOrigin);

        if (isSameApp) {
          return (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                backgroundColor: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
              }}
            >
              <h2 style={{ margin: "0 0 16px 0", color: "#dc2626" }}>
                ⚠️ Invalid URL
              </h2>
              <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
                You cannot embed this application within itself. This would
                create an infinite loop.
              </p>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  borderRadius: "6px",
                  color: "#0369a1",
                  fontSize: "14px",
                }}
              >
                <strong>💡 Tip:</strong> Use an external website URL like:
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>
                    <code>https://example.com</code>
                  </li>
                  <li>
                    <code>https://thoughtspot.com</code>
                  </li>
                  <li>
                    <code>https://github.com</code>
                  </li>
                </ul>
              </div>
            </div>
          );
        }

        return (
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            {iframeError ? (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#fed7d7",
                  border: "1px solid #feb2b2",
                  borderRadius: "8px",
                  color: "#c53030",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 12px 0" }}>
                  <strong>Error:</strong> {iframeError}
                </p>
                <p style={{ margin: "0", fontSize: "14px" }}>
                  Try a different website or check if the website allows iframe
                  embedding.
                </p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={urlToDisplay}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "8px",
                }}
                title="Embedded website"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            )}
          </div>
        );

      case "embed":
        if (!mappedValue || !mappedValue.trim()) {
          return (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                backgroundColor: "#f7fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
                🔍 ThoughtSpot Content
              </h2>
              <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
                Configure a ThoughtSpot content ID in the settings to display
                liveboards, answers, or spotter content on your home page.
              </p>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  borderRadius: "6px",
                  color: "#0369a1",
                  fontSize: "14px",
                }}
              >
                <strong>💡 Tip:</strong> You can embed:
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>
                    <strong>Liveboards:</strong> Complete dashboards with
                    multiple visualizations
                  </li>
                  <li>
                    <strong>Answers:</strong> Individual charts or tables
                  </li>
                  <li>
                    <strong>Spotter:</strong> AI-powered data analysis
                  </li>
                </ul>
              </div>
            </div>
          );
        }

        // Determine the content type from the home menu
        const contentType = homeMenu?.homePageType;
        if (!contentType) {
          return (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#4a5568" }}
            >
              Unable to determine content type. Please check your configuration.
            </div>
          );
        }

        // Create ThoughtSpot content object
        // Map spotter to model type since Spotter uses worksheet/model IDs
        const contentTypeForEmbed =
          contentType === "spotter" ? "model" : contentType;
        const thoughtSpotContent: ThoughtSpotContent = {
          id: mappedValue,
          name: `${contentType} Content`, // Default name for the content
          type: contentTypeForEmbed as "liveboard" | "answer" | "model",
        };

        return (
          <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
            <ThoughtSpotEmbed
              content={thoughtSpotContent}
              width="100%"
              height="100%"
              onError={(error) => {
                console.error("ThoughtSpot embed error:", error);
                setIframeError(`Failed to load ${contentType}: ${error}`);
              }}
            />
          </div>
        );

      default:
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
              ⚙️ Configuration Required
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Please configure your home page content in the settings.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        overflow: "hidden",
        display: "flex",
        minHeight: 0,
        flexDirection: "column",
      }}
    >
      {renderContent()}
    </div>
  );
}
