"use client";

import MaterialIcon from "./MaterialIcon";

interface PortalShortcutProps {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
}

export default function PortalShortcut({
  href,
  title,
  description,
  actionLabel,
}: PortalShortcutProps) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "14px 16px",
        background:
          "linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(248, 250, 252, 1))",
        border: "1px solid #dbeafe",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "999px",
            backgroundColor: "#dbeafe",
            color: "#1d4ed8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MaterialIcon icon="full-app" size={20} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "#475569",
            }}
          >
            {description}
          </span>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 16px",
          borderRadius: "999px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 20px rgba(37, 99, 235, 0.18)",
        }}
      >
        {actionLabel}
      </a>
    </div>
  );
}
