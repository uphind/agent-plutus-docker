"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ProviderKey = "anthropic" | "openai" | "gemini" | "cursor";

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  headers: Record<string, string>;
  body?: string;
  response?: string;
  notes?: string;
}

const PROVIDERS: Record<ProviderKey, {
  name: string;
  color: string;
  baseUrl: string;
  authHeader: string;
  description: string;
  docsUrl: string;
  endpoints: ApiEndpoint[];
}> = {
  anthropic: {
    name: "Anthropic",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    baseUrl: "https://api.anthropic.com",
    authHeader: "x-api-key: sk-ant-api03-...",
    description: "Claude models via the Messages API. Agent Plutus syncs usage data from the Admin API to track costs per user and model.",
    docsUrl: "https://docs.anthropic.com/en/api",
    endpoints: [
      {
        method: "POST",
        path: "/v1/messages",
        description: "Send a message to Claude and receive a response",
        headers: {
          "x-api-key": "sk-ant-api03-YOUR_KEY",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            { role: "user", content: "Explain quantum computing in 3 sentences." }
          ]
        }, null, 2),
        response: JSON.stringify({
          id: "msg_01XFDUDYJgAACzvnptvVoYEL",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Quantum computing harnesses..." }],
          model: "claude-sonnet-4-20250514",
          usage: {
            input_tokens: 25,
            output_tokens: 150,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0
          }
        }, null, 2),
        notes: "Usage tracked: input_tokens, output_tokens, cache tokens. Cost calculated per model pricing.",
      },
      {
        method: "GET",
        path: "/v1/organizations/{org_id}/api_keys/{api_key_id}/usage",
        description: "Retrieve usage data for an API key (Admin API)",
        headers: {
          "x-api-key": "sk-ant-admin-YOUR_ADMIN_KEY",
          "anthropic-version": "2023-06-01",
        },
        response: JSON.stringify({
          data: [
            {
              date: "2026-03-15",
              model: "claude-sonnet-4-20250514",
              usage: { input_tokens: 125000, output_tokens: 42000 },
              cost_usd: 0.45
            }
          ]
        }, null, 2),
        notes: "Agent Plutus uses this endpoint to sync daily usage per API key.",
      },
    ],
  },
  openai: {
    name: "OpenAI",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    baseUrl: "https://api.openai.com",
    authHeader: "Authorization: Bearer sk-proj-...",
    description: "GPT and o-series models. Agent Plutus pulls usage from the Organization Usage API to attribute costs by API key and user.",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    endpoints: [
      {
        method: "POST",
        path: "/v1/chat/completions",
        description: "Create a chat completion",
        headers: {
          "Authorization": "Bearer sk-proj-YOUR_KEY",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "What is the capital of France?" }
          ],
          max_tokens: 256
        }, null, 2),
        response: JSON.stringify({
          id: "chatcmpl-abc123",
          object: "chat.completion",
          model: "gpt-4o-2024-08-06",
          choices: [{
            message: { role: "assistant", content: "The capital of France is Paris." },
            finish_reason: "stop"
          }],
          usage: {
            prompt_tokens: 28,
            completion_tokens: 12,
            total_tokens: 40
          }
        }, null, 2),
        notes: "Usage fields: prompt_tokens (input), completion_tokens (output). Batch API available at 50% discount for non-time-sensitive requests.",
      },
      {
        method: "GET",
        path: "/v1/organization/usage/completions?date=2026-03-15",
        description: "Get daily usage breakdown by API key (Organization API)",
        headers: {
          "Authorization": "Bearer sk-admin-YOUR_ADMIN_KEY",
        },
        response: JSON.stringify({
          object: "page",
          data: [{
            aggregation_timestamp: 1742169600,
            n_requests: 1250,
            n_context_tokens_total: 850000,
            n_generated_tokens_total: 320000,
            api_key_id: "sk-proj-abc123",
            model: "gpt-4o",
            cost_in_major: 15.20
          }]
        }, null, 2),
        notes: "Agent Plutus syncs this daily. Supports breakdowns by api_key_id, model, and user.",
      },
    ],
  },
  gemini: {
    name: "Google Gemini",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    baseUrl: "https://generativelanguage.googleapis.com",
    authHeader: "x-goog-api-key: AIza...",
    description: "Gemini models via the Generative Language API. Usage is tracked per request and aggregated by Agent Plutus.",
    docsUrl: "https://ai.google.dev/api",
    endpoints: [
      {
        method: "POST",
        path: "/v1beta/models/gemini-2.5-pro:generateContent",
        description: "Generate content with a Gemini model",
        headers: {
          "x-goog-api-key": "AIza-YOUR_KEY",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Write a haiku about programming." }]
          }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.7
          }
        }, null, 2),
        response: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: "Semicolons fall\nLike rain upon the IDE\nCode compiles at last" }],
              role: "model"
            },
            finishReason: "STOP"
          }],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 24,
            totalTokenCount: 36
          }
        }, null, 2),
        notes: "Usage tracked via usageMetadata. promptTokenCount maps to input, candidatesTokenCount to output.",
      },
      {
        method: "GET",
        path: "/v1beta/apikeys/{key_id}/usage",
        description: "Get usage metrics for an API key",
        headers: {
          "Authorization": "Bearer ya29.YOUR_OAUTH_TOKEN",
        },
        response: JSON.stringify({
          usage: [{
            date: "2026-03-15",
            model: "gemini-2.5-pro",
            requestCount: 450,
            inputTokens: 280000,
            outputTokens: 95000,
            estimatedCost: 0.42
          }]
        }, null, 2),
        notes: "Requires OAuth2 credentials or service account. Agent Plutus uses this for daily sync.",
      },
    ],
  },
  cursor: {
    name: "Cursor",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    baseUrl: "https://api.cursor.com",
    authHeader: "Authorization: Bearer cur_...",
    description: "Cursor IDE usage data including completions, chat, and agent requests. Agent Plutus syncs team usage via the Business API.",
    docsUrl: "https://docs.cursor.com/account/api",
    endpoints: [
      {
        method: "GET",
        path: "/v1/team/usage?startDate=2026-03-01&endDate=2026-03-31",
        description: "Get team usage data for a date range",
        headers: {
          "Authorization": "Bearer cur_YOUR_TEAM_API_KEY",
        },
        response: JSON.stringify({
          data: [{
            email: "alice.chen@demo-org.com",
            date: "2026-03-15",
            model: "cursor-fast",
            requests: {
              composer: 12,
              chat: 28,
              agent: 5,
              tab: 85,
              fast_premium: 3
            },
            tokens: {
              input: 45000,
              output: 18000
            },
            completions: {
              lines_suggested: 320,
              lines_accepted: 215,
              accept_rate: 0.672
            }
          }],
          pagination: { page: 1, total: 450 }
        }, null, 2),
        notes: "Agent Plutus tracks lines_accepted and lines_suggested for ROI calculation. accept_rate is used for benchmarking.",
      },
      {
        method: "GET",
        path: "/v1/team/seats",
        description: "List team seats and their status",
        headers: {
          "Authorization": "Bearer cur_YOUR_TEAM_API_KEY",
        },
        response: JSON.stringify({
          seats: [{
            email: "alice.chen@demo-org.com",
            role: "member",
            status: "active",
            lastActiveAt: "2026-03-31T14:22:00Z",
            plan: "business"
          }],
          total: 15,
          active: 13,
          idle: 2
        }, null, 2),
        notes: "Used by seat optimization to identify idle and underutilized seats.",
      },
    ],
  },
};

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold", colors[method] ?? "bg-gray-100 text-gray-700")}>
      {method}
    </span>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {label && (
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      )}
      <div className="bg-gray-950 rounded-lg overflow-hidden">
        <pre className="p-4 text-[13px] leading-relaxed text-gray-300 overflow-x-auto font-mono">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white text-xs"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: ApiEndpoint; baseUrl: string }) {
  const [expanded, setExpanded] = useState(false);

  const curlCmd = [
    `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}"`,
    ...Object.entries(endpoint.headers).map(([k, v]) => `  -H "${k}: ${v}"`),
    ...(endpoint.body ? [`  -d '${endpoint.body}'`] : []),
  ].join(" \\\n");

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-foreground flex-1">{endpoint.path}</code>
        <span className="text-xs text-muted-foreground hidden sm:block">{endpoint.description}</span>
        <svg className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          <CodeBlock code={curlCmd} label="cURL Example" />

          {endpoint.body && (
            <CodeBlock code={endpoint.body} label="Request Body" />
          )}

          {endpoint.response && (
            <CodeBlock code={endpoint.response} label="Response" />
          )}

          {endpoint.notes && (
            <div className="flex gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-muted-foreground">{endpoint.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [activeProvider, setActiveProvider] = useState<ProviderKey>("anthropic");
  const provider = PROVIDERS[activeProvider];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Provider API endpoints and example requests used by Agent Plutus for usage tracking.
        </p>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(PROVIDERS) as [ProviderKey, typeof PROVIDERS[ProviderKey]][]).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setActiveProvider(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              activeProvider === key
                ? p.color
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Provider detail */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{provider.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
          </div>
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1 shrink-0"
          >
            Official Docs
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Connection info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Base URL</div>
            <code className="text-sm font-mono">{provider.baseUrl}</code>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Authentication</div>
            <code className="text-sm font-mono">{provider.authHeader}</code>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Endpoints</h3>
          {provider.endpoints.map((ep, i) => (
            <EndpointCard key={i} endpoint={ep} baseUrl={provider.baseUrl} />
          ))}
        </div>
      </div>

      {/* Integration summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">How Agent Plutus Tracks Usage</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: "1", title: "API Keys", desc: "Configure provider API keys in Settings. Keys are encrypted at rest." },
            { step: "2", title: "Sync", desc: "Agent Plutus periodically calls each provider's admin/usage API to pull usage data." },
            { step: "3", title: "Attribution", desc: "Usage is attributed to users based on API key IDs, email mapping, or team membership." },
            { step: "4", title: "Analytics", desc: "Data is aggregated into dashboards, reports, forecasts, and cost optimization suggestions." },
          ].map((s) => (
            <div key={s.step} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{s.step}</span>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
