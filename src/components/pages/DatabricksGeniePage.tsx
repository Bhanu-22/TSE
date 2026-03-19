"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../Layout";

type GenieAttachment = Record<string, unknown>;

type GenieApiResponse = {
  conversationId: string;
  messageId: string;
  response: unknown[];
};

type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "genie";
      attachments: GenieAttachment[];
    }
  | {
      id: string;
      role: "error";
      content: string;
    };

const renderBoldMarkdown = (content: string) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    if (!isBold) return <span key={index}>{part}</span>;
    const inner = part.slice(2, -2);
    return <strong key={index}>{inner}</strong>;
  });
};

function TypingIndicator() {
  const dotBase: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "9999px",
    backgroundColor: "#64748b",
    opacity: 0.6,
    animation: "dbDotPulse 1.4s infinite ease-in-out",
  };

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <div style={{ ...dotBase, animationDelay: "0s" }} />
      <div style={{ ...dotBase, animationDelay: "0.2s" }} />
      <div style={{ ...dotBase, animationDelay: "0.4s" }} />
      <style>{`@keyframes dbDotPulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

export default function DatabricksGeniePage() {
  const context = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sqlVisible, setSqlVisible] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const genieSpaceId = context.appConfig.databricks?.genieSpaceId?.trim() || "";

  const canChat = useMemo(() => Boolean(genieSpaceId), [genieSpaceId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isSending]);

  useEffect(() => {
    if (!canChat) return;
    const timeoutId = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timeoutId);
  }, [canChat]);

  const sendMessage = async (overrideMessage?: string) => {
    if (!canChat || isSending) return;
    const trimmed = (overrideMessage ?? inputValue).trim();
    if (!trimmed) return;

    const newUserMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-user`;

    setMessages((prev) => [
      ...prev,
      { id: newUserMessageId, role: "user", content: trimmed },
    ]);
    setInputValue("");
    setIsSending(true);

    try {
      const payload = {
        action: conversationId ? ("followup" as const) : ("start" as const),
        spaceId: genieSpaceId,
        message: trimmed,
        ...(conversationId ? { conversationId } : {}),
      };

      const response = await fetch("/api/databricks/genie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | GenieApiResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && data.error
            ? String(data.error)
            : `Genie request failed (${response.status})`;
        throw new Error(message);
      }

      const okData = data as GenieApiResponse;
      if (!okData?.conversationId) {
        throw new Error("Genie response missing conversationId");
      }

      setConversationId(okData.conversationId);

      const newGenieMessageId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-genie`;

      setMessages((prev) => [
        ...prev,
        {
          id: newGenieMessageId,
          role: "genie",
          attachments: Array.isArray(okData.response)
            ? (okData.response as GenieAttachment[])
            : [],
        },
      ]);
    } catch (error) {
      const newErrorMessageId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-error`;

      setMessages((prev) => [
        ...prev,
        {
          id: newErrorMessageId,
          role: "error",
          content:
            error instanceof Error ? error.message : "Something went wrong",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!canChat) {
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
          Genie not configured. Please provide genieSpaceId in the JSON config.
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
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "18px 20px",
        }}
      >
        {messages.length === 0 && !isSending && (
          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            Ask me anything about your data
          </div>
        )}

        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div
                key={message.id}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    backgroundColor: "#446cf3",
                    color: "white",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    marginBottom: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    fontSize: "14px",
                  }}
                >
                  {message.content}
                </div>
              </div>
            );
          }

          if (message.role === "error") {
            return (
              <div
                key={message.id}
                style={{ display: "flex", justifyContent: "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    marginBottom: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    fontSize: "14px",
                  }}
                >
                  {message.content}
                </div>
              </div>
            );
          }

          const attachments = message.attachments || [];
          const textParts = attachments
            .map((attachment) => {
              const text = (attachment as { text?: { content?: unknown } }).text;
              return typeof text?.content === "string" ? text.content : "";
            })
            .filter(Boolean);

          const queryParts = attachments
            .map((attachment) => {
              const query = (attachment as { query?: Record<string, unknown> })
                .query;
              const sql = typeof query?.query === "string" ? query.query : "";
              const description =
                typeof query?.description === "string" ? query.description : "";
              const attachmentId =
                typeof (attachment as { attachment_id?: unknown }).attachment_id ===
                "string"
                  ? ((attachment as { attachment_id?: string }).attachment_id ||
                      "")
                  : "";
              const columnsRaw = query?.columns;
              const rowsRaw = query?.rows;
              const columns = Array.isArray(columnsRaw)
                ? (columnsRaw as Array<{ name?: string; type_name?: string }>)
                : null;
              const rows = Array.isArray(rowsRaw) ? (rowsRaw as unknown[][]) : null;
              return sql ? { attachmentId, sql, description, columns, rows } : null;
            })
            .filter(
              (
                value
              ): value is {
                attachmentId: string;
                sql: string;
                description: string;
                columns: Array<{ name?: string; type_name?: string }> | null;
                rows: unknown[][] | null;
              } => value !== null
            );

          const suggestedQuestions = attachments
            .flatMap((attachment) => {
              const suggested = (
                attachment as { suggested_questions?: { questions?: unknown } }
              ).suggested_questions;
              const questions = suggested?.questions;
              return Array.isArray(questions) ? questions : [];
            })
            .filter(
              (q): q is string => typeof q === "string" && q.trim().length > 0
            );

          return (
            <div
              key={message.id}
              style={{ display: "flex", justifyContent: "flex-start" }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  backgroundColor: "#f1f5f9",
                  color: "#0f172a",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  marginBottom: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  lineHeight: 1.4,
                  fontSize: "14px",
                }}
              >
                {textParts.map((text, index) => (
                  <div
                    key={`text-${index}`}
                    style={{ whiteSpace: "pre-wrap", marginBottom: "10px" }}
                  >
                    {renderBoldMarkdown(text)}
                  </div>
                ))}
                {queryParts.map((query, index) => {
                  const attachmentKey =
                    query.attachmentId || `${message.id}-query-${index}`;
                  const hasResults =
                    Array.isArray(query.columns) && Array.isArray(query.rows);

                  if (!hasResults) {
                    return (
                      <div key={attachmentKey} style={{ marginBottom: "10px" }}>
                        {query.description && (
                          <div
                            style={{
                              fontSize: "12px",
                              fontStyle: "italic",
                              color: "#475569",
                              marginBottom: "6px",
                            }}
                          >
                            {query.description}
                          </div>
                        )}
                        <pre
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            overflowX: "auto",
                            margin: 0,
                            fontSize: "12px",
                          }}
                        >
                          <code>{query.sql}</code>
                        </pre>
                      </div>
                    );
                  }

                  const columns = query.columns || [];
                  const rows = query.rows || [];
                  const visible = Boolean(sqlVisible[attachmentKey]);
                  const displayedRows = rows.slice(0, 50);

                  const effectiveColumns =
                    columns.length > 0
                      ? columns
                      : displayedRows.length > 0 &&
                          Array.isArray(displayedRows[0])
                        ? Array.from({ length: displayedRows[0].length }).map(
                            (_, i) => ({ name: `Column ${i + 1}` })
                          )
                        : [];

                  return (
                    <div key={attachmentKey} style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontStyle: "italic",
                            color: "#475569",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {query.description || ""}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSqlVisible((prev) => ({
                              ...prev,
                              [attachmentKey]: !prev[attachmentKey],
                            }))
                          }
                          style={{
                            fontSize: "12px",
                            color: "#446cf3",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {visible ? "Hide SQL" : "View SQL"}
                        </button>
                      </div>

                      {visible && (
                        <pre
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            overflowX: "auto",
                            margin: 0,
                            marginBottom: "10px",
                            fontSize: "12px",
                          }}
                        >
                          <code>{query.sql}</code>
                        </pre>
                      )}

                      {rows.length === 0 ? (
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "13px",
                            fontStyle: "italic",
                          }}
                        >
                          No results returned
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr>
                                {effectiveColumns.map((col, colIndex) => (
                                  <th
                                    key={`${col.name || "col"}-${colIndex}`}
                                    style={{
                                      background: "#f8fafc",
                                      fontWeight: 600,
                                      fontSize: "12px",
                                      color: "#374151",
                                      padding: "8px 12px",
                                      borderBottom: "2px solid #e2e8f0",
                                      textAlign: "left",
                                    }}
                                  >
                                    {col.name || `Column ${colIndex + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {displayedRows.map((row, rowIndex) => (
                                <tr
                                  key={`row-${rowIndex}`}
                                  style={{
                                    backgroundColor:
                                      rowIndex % 2 === 0 ? "white" : "#f8fafc",
                                  }}
                                >
                                  {effectiveColumns.map((_, colIndex) => {
                                    const value = Array.isArray(row)
                                      ? row[colIndex]
                                      : undefined;
                                    const display =
                                      value === null || value === undefined
                                        ? ""
                                        : String(value);
                                    return (
                                      <td
                                        key={`cell-${rowIndex}-${colIndex}`}
                                        style={{
                                          fontSize: "13px",
                                          color: "#0f172a",
                                          padding: "8px 12px",
                                          borderBottom: "1px solid #f1f5f9",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {display}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {rows.length > 50 && (
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          Showing first 50 of {rows.length} rows
                        </div>
                      )}
                    </div>
                  );
                })}
                {suggestedQuestions.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "6px",
                    }}
                  >
                    {suggestedQuestions.map((q, index) => (
                      <button
                        key={`${q}-${index}`}
                        type="button"
                        onClick={() => {
                          setInputValue(q);
                          setTimeout(() => void sendMessage(q), 0);
                        }}
                        style={{
                          background: "white",
                          border: "1px solid #d1d5db",
                          color: "#374151",
                          fontSize: "12px",
                          padding: "6px 12px",
                          borderRadius: "999px",
                          cursor: "pointer",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {textParts.length === 0 &&
                  queryParts.length === 0 &&
                  suggestedQuestions.length === 0 && (
                  <pre
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      overflowX: "auto",
                      margin: 0,
                      fontSize: "12px",
                    }}
                  >
                    <code>{JSON.stringify(attachments, null, 2)}</code>
                  </pre>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "78%",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                padding: "12px 14px",
                borderRadius: "14px",
                marginBottom: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: "14px 16px",
          backgroundColor: "white",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendMessage();
              }
            }}
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            style={{
              padding: "12px 18px",
              backgroundColor: "#446cf3",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: !inputValue.trim() || isSending ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              opacity: !inputValue.trim() || isSending ? 0.6 : 1,
              transition: "opacity 0.15s ease",
              minWidth: "78px",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
