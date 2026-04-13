// ═══════════════════════════════════════════════════════════════════
// Dual AI Provider: vLLM (primary) + AWS Bedrock Claude (fallback)
// ═══════════════════════════════════════════════════════════════════

export type AIProvider = "vllm" | "bedrock";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const VLLM_URL = "http://10.60.16.28:7000/v1/chat/completions";
const BEDROCK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bedrock-proxy`;

const SYSTEM_PROMPT = `You are the OneDrive Intelligence Agent — a helpful AI assistant embedded in an enterprise OneDrive analytics dashboard.

You have two capabilities:
1. **Data Queries**: Answer questions about files, drives, duplicates, versions, permissions, sync status, departments, and users.
2. **UI Navigation**: Guide users to the right page or section of the dashboard and can trigger navigation actions.

## Dashboard Pages & Navigation:
- "/" or "Dashboard" — Main overview with KPIs, charts, alerts, file search, and chat
- "/users" — User Analytics: department breakdown, user list sorted by duplicates
- "/users/compare" — Compare two users side-by-side (storage, duplicates, activity)
- "/users/:userId" — Individual user deep-dive (e.g. "/users/u-001" for Priya Sharma)
- "/storage" — Storage detail breakdown
- "/drives" — Drive-level analytics
- "/duplicates" — Duplicate file analysis
- "/versions" — File version history
- "/shared" — Shared files and permissions

## Dashboard Tabs (on main page):
- "overview" — KPIs and storage charts
- "drives" — Drive distribution and sync status
- "versions" — File version tracking
- "permissions" — Permission roles and subjects
- "sync" — Sync run status
- "explorer" — File tree explorer

## UI Action Commands:
When the user wants to navigate somewhere, include a JSON action block in your response like:
\`\`\`action
{"type":"navigate","path":"/users"}
\`\`\`
or for tab switching:
\`\`\`action
{"type":"tab","tab":"drives"}
\`\`\`

## Important:
- If asked "where can I see X", explain the location AND include the navigation action
- For user-specific queries, reference actual user names and IDs
- Always be concise and helpful
- Format important data with **bold**`;

export async function callAI(
  messages: AIMessage[],
  provider: AIProvider = "vllm",
  onFallback?: () => void,
): Promise<{ content: string; provider: AIProvider }> {
  const fullMessages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  if (provider === "vllm") {
    try {
      return await callVLLM(fullMessages);
    } catch (err) {
      console.warn("vLLM failed, falling back to Bedrock:", err);
      onFallback?.();
      return await callBedrock(fullMessages);
    }
  } else {
    try {
      return await callBedrock(fullMessages);
    } catch (err) {
      console.warn("Bedrock failed, falling back to vLLM:", err);
      onFallback?.();
      return await callVLLM(fullMessages);
    }
  }
}

async function callVLLM(messages: AIMessage[]): Promise<{ content: string; provider: AIProvider }> {
  const resp = await fetch(VLLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "chat",
      messages,
      max_tokens: 4500,
      temperature: 0.7,
      top_p: 0.95,
      stream: false,
    }),
  });

  if (!resp.ok) {
    throw new Error(`vLLM error: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "No response from vLLM.";
  return { content, provider: "vllm" };
}

async function callBedrock(messages: AIMessage[]): Promise<{ content: string; provider: AIProvider }> {
  const resp = await fetch(BEDROCK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 4500,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Bedrock error: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "No response from Bedrock.";
  return { content, provider: "bedrock" };
}
