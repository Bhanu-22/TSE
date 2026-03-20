import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

type GenieAction = "start" | "followup";

type GenieRequestBody = {
  action: GenieAction;
  spaceId: string;
  message: string;
  conversationId?: string;
  workspaceUrl?: string;
};

type DatabricksTokenSuccess = {
  access_token: string;
  token_type: string;
};

type DatabricksTokenError = {
  error?: string;
  error_description?: string;
  message?: string;
};

type StartConversationResponse = {
  conversation_id?: string;
  conversationId?: string;
  message_id?: string;
  messageId?: string;
};

type PostMessageResponse = {
  message_id?: string;
  messageId?: string;
};

type GenieMessagePollResponse = {
  status?: string;
  attachments?: unknown[];
  error?: unknown;
};

type SqlStatementColumn = {
  name: string;
  type_name: string;
};

type SqlStatementResponse = {
  status?: {
    state?: string;
  };
  manifest?: {
    schema?: {
      columns?: SqlStatementColumn[];
    };
  };
  result?: {
    data_array?: unknown[][];
  };
};

const normalizeDatabricksHost = (host: string): string => {
  const trimmed = host.trim().replace(/\/$/, "");
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getDatabricksAccessToken = async (
  hostOverride?: string
): Promise<string> => {
  const databricksHost = hostOverride || process.env.DATABRICKS_HOST;
  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;

  if (!databricksHost) {
    throw new Error("DATABRICKS_HOST not configured");
  }
  if (!clientId) {
    throw new Error("DATABRICKS_CLIENT_ID not configured");
  }
  if (!clientSecret) {
    throw new Error("DATABRICKS_CLIENT_SECRET not configured");
  }

  const normalizedHost = normalizeDatabricksHost(databricksHost);
  const tokenUrl = `${normalizedHost}/oidc/v1/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("scope", "all-apis");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const rawText = await response.text().catch(() => "");
  const parsedJson = (() => {
    if (!rawText) return null;
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      return null;
    }
  })();

  if (!response.ok) {
    const errorData = (parsedJson || {}) as DatabricksTokenError;
    const message =
      errorData.error_description ||
      errorData.error ||
      errorData.message ||
      rawText ||
      `Databricks token request failed (${response.status})`;
    throw new Error(message);
  }

  const data = (parsedJson || {}) as DatabricksTokenSuccess;
  if (!data.access_token) {
    throw new Error("Databricks token response missing access_token");
  }

  return data.access_token;
};

const fetchSqlStatement = async (args: {
  host: string;
  token: string;
  statementId: string;
}): Promise<SqlStatementResponse> => {
  const normalizedHost = normalizeDatabricksHost(args.host);
  const url = `${normalizedHost}/api/2.0/sql/statements/${encodeURIComponent(
    args.statementId
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${args.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const rawText = await response.text().catch(() => "");
  const parsedJson = (() => {
    if (!rawText) return null;
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      return null;
    }
  })();

  if (!response.ok) {
    throw new Error(rawText || `Statement API failed (${response.status})`);
  }

  return (parsedJson || {}) as SqlStatementResponse;
};

const tryGetStatementResults = async (args: {
  host: string;
  token: string;
  statementId: string;
  maxPolls?: number;
  intervalMs?: number;
}): Promise<{ columns: SqlStatementColumn[]; rows: unknown[][] } | null> => {
  const { host, token, statementId, maxPolls = 15, intervalMs = 1000 } = args;

  for (let i = 0; i < maxPolls; i++) {
    let data: SqlStatementResponse;
    try {
      data = await fetchSqlStatement({ host, token, statementId });
    } catch {
      return null;
    }

    const state = (data.status?.state || "").toString().toUpperCase();
    if (state === "FAILED") {
      return null;
    }
    if (state === "SUCCEEDED") {
      const columns = Array.isArray(data.manifest?.schema?.columns)
        ? (data.manifest?.schema?.columns as SqlStatementColumn[])
        : [];
      const rows = Array.isArray(data.result?.data_array)
        ? (data.result?.data_array as unknown[][])
        : [];
      return { columns, rows };
    }

    await sleep(intervalMs);
  }

  return null;
};

const enrichAttachmentsWithStatementResults = async (args: {
  host: string;
  token: string;
  attachments: unknown[];
}): Promise<unknown[]> => {
  const { host, token, attachments } = args;

  return Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment || typeof attachment !== "object") return attachment;

      const record = attachment as Record<string, unknown>;
      const query = record.query;
      if (!query || typeof query !== "object") return attachment;

      const queryRecord = query as Record<string, unknown>;
      const statementIdRaw =
        queryRecord.statement_id ?? queryRecord.statementId ?? "";
      const statementId =
        typeof statementIdRaw === "string" ? statementIdRaw.trim() : "";
      if (!statementId) return attachment;

      const statementResults = await tryGetStatementResults({
        host,
        token,
        statementId,
      });
      if (!statementResults) return attachment;

      return {
        ...record,
        query: {
          ...queryRecord,
          columns: statementResults.columns,
          rows: statementResults.rows,
        },
      };
    })
  );
};

const pollGenieMessage = async (args: {
  host: string;
  token: string;
  spaceId: string;
  conversationId: string;
  messageId: string;
  maxPolls?: number;
  intervalMs?: number;
}): Promise<GenieMessagePollResponse> => {
  const {
    host,
    token,
    spaceId,
    conversationId,
    messageId,
    maxPolls = 30,
    intervalMs = 1500,
  } = args;

  const normalizedHost = normalizeDatabricksHost(host);
  const url = `${normalizedHost}/api/2.0/genie/spaces/${encodeURIComponent(
    spaceId
  )}/conversations/${encodeURIComponent(
    conversationId
  )}/messages/${encodeURIComponent(messageId)}`;

  for (let i = 0; i < maxPolls; i++) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const rawText = await response.text().catch(() => "");
    const parsedJson = (() => {
      if (!rawText) return null;
      try {
        return JSON.parse(rawText) as unknown;
      } catch {
        return null;
      }
    })();

    if (!response.ok) {
      const message =
        rawText || `Genie poll request failed (${response.status})`;
      throw new Error(message);
    }

    const data = (parsedJson || {}) as GenieMessagePollResponse;
    const status = (data.status || "").toString().toUpperCase();
    if (status === "COMPLETED" || status === "FAILED") {
      return data;
    }

    await sleep(intervalMs);
  }

  throw new Error("Timed out waiting for Genie response");
};

export async function POST(request: NextRequest) {
  let body: GenieRequestBody;
  try {
    body = (await request.json()) as GenieRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const action = body.action;
  const spaceId = body.spaceId?.trim?.() || "";
  const userMessage = body.message?.trim?.() || "";
  const conversationId = body.conversationId?.trim?.() || "";

  if (action !== "start" && action !== "followup") {
    return NextResponse.json(
      { error: 'Invalid action. Expected "start" or "followup".' },
      { status: 400 }
    );
  }
  if (!spaceId) {
    return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
  }
  if (!userMessage) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (action === "followup" && !conversationId) {
    return NextResponse.json(
      { error: "conversationId is required for followup" },
      { status: 400 }
    );
  }

  const databricksHost =
    body.workspaceUrl?.trim?.() ||
    request.cookies.get("databricks_workspace")?.value ||
    process.env.DATABRICKS_HOST;
  if (!databricksHost) {
    return NextResponse.json(
      { error: "DATABRICKS_HOST not configured" },
      { status: 500 }
    );
  }

  let token: string;
  try {
    token = await getDatabricksAccessToken(databricksHost);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get token" },
      { status: 500 }
    );
  }

  const normalizedHost = normalizeDatabricksHost(databricksHost);

  try {
    if (action === "start") {
      const startUrl = `${normalizedHost}/api/2.0/genie/spaces/${encodeURIComponent(
        spaceId
      )}/start-conversation`;

      const startResponse = await fetch(startUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ content: userMessage }),
        cache: "no-store",
      });

      const startRaw = await startResponse.text().catch(() => "");
      const startJson = (() => {
        if (!startRaw) return null;
        try {
          return JSON.parse(startRaw) as unknown;
        } catch {
          return null;
        }
      })();

      if (!startResponse.ok) {
        return NextResponse.json(
          {
            error:
              startRaw ||
              `Failed to start Genie conversation (${startResponse.status})`,
          },
          { status: 500 }
        );
      }

      const startData = (startJson || {}) as StartConversationResponse;
      const newConversationId =
        startData.conversation_id || startData.conversationId || "";
      const newMessageId = startData.message_id || startData.messageId || "";

      if (!newConversationId || !newMessageId) {
        return NextResponse.json(
          {
            error:
              "Genie start-conversation response missing conversationId or messageId",
          },
          { status: 500 }
        );
      }

      const polled = await pollGenieMessage({
        host: databricksHost,
        token,
        spaceId,
        conversationId: newConversationId,
        messageId: newMessageId,
      });

      const polledStatus = (polled.status || "").toString().toUpperCase();
      if (polledStatus === "FAILED") {
        return NextResponse.json(
          { error: "Genie response failed" },
          { status: 500 }
        );
      }

      const attachments = Array.isArray(polled.attachments)
        ? polled.attachments
        : [];
      const enrichedAttachments = await enrichAttachmentsWithStatementResults({
        host: databricksHost,
        token,
        attachments,
      });

      return NextResponse.json({
        conversationId: newConversationId,
        messageId: newMessageId,
        response: enrichedAttachments,
      });
    }

    const followupUrl = `${normalizedHost}/api/2.0/genie/spaces/${encodeURIComponent(
      spaceId
    )}/conversations/${encodeURIComponent(conversationId)}/messages`;

    const followupResponse = await fetch(followupUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ content: userMessage }),
      cache: "no-store",
    });

    const followupRaw = await followupResponse.text().catch(() => "");
    const followupJson = (() => {
      if (!followupRaw) return null;
      try {
        return JSON.parse(followupRaw) as unknown;
      } catch {
        return null;
      }
    })();

    if (!followupResponse.ok) {
      return NextResponse.json(
        {
          error:
            followupRaw ||
            `Failed to send Genie follow-up (${followupResponse.status})`,
        },
        { status: 500 }
      );
    }

    const followupData = (followupJson || {}) as PostMessageResponse;
    const newMessageId = followupData.message_id || followupData.messageId || "";

    if (!newMessageId) {
      return NextResponse.json(
        { error: "Genie follow-up response missing messageId" },
        { status: 500 }
      );
    }

    const polled = await pollGenieMessage({
      host: databricksHost,
      token,
      spaceId,
      conversationId,
      messageId: newMessageId,
    });

    const polledStatus = (polled.status || "").toString().toUpperCase();
    if (polledStatus === "FAILED") {
      return NextResponse.json({ error: "Genie response failed" }, { status: 500 });
    }

    const attachments = Array.isArray(polled.attachments) ? polled.attachments : [];
    const enrichedAttachments = await enrichAttachmentsWithStatementResults({
      host: databricksHost,
      token,
      attachments,
    });

    return NextResponse.json({
      conversationId,
      messageId: newMessageId,
      response: enrichedAttachments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Genie request failed",
      },
      { status: 500 }
    );
  }
}
