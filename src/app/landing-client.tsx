"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";

const providers = ["Anthropic", "OpenAI", "Cursor", "Gemini", "Vertex AI"];

/* ── Demo chart: Department budget bar chart ── */
function BudgetChart() {
  const departments = [
    { name: "Engineering", spent: 12400, budget: 15000 },
    { name: "Data Science", spent: 18200, budget: 12000 },
    { name: "Product", spent: 6800, budget: 10000 },
    { name: "Marketing", spent: 3200, budget: 5000 },
    { name: "Support", spent: 4900, budget: 5000 },
  ];
  const maxVal = Math.max(...departments.map((d) => Math.max(d.spent, d.budget)));

  return (
    <div className="space-y-3">
      {departments.map((d) => {
        const overBudget = d.spent > d.budget;
        return (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-foreground font-medium">{d.name}</span>
              <span className={overBudget ? "text-red-500 font-semibold" : "text-muted-foreground"}>
                ${d.spent.toLocaleString()}
                <span className="text-muted-foreground font-normal"> / ${d.budget.toLocaleString()}</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${(d.budget / maxVal) * 100}%`,
                  backgroundColor: "rgba(22,22,231,0.12)",
                }}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-brand"}`}
                style={{ width: `${(d.spent / maxVal) * 100}%` }}
              />
            </div>
            {overBudget && (
              <p className="text-[10px] text-red-500 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {Math.round(((d.spent - d.budget) / d.budget) * 100)}% over budget
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Demo chart: Model usage donut (SVG) ── */
function ModelUsageChart() {
  const models = [
    { name: "Claude Sonnet 4", pct: 72, color: "#1616e7" },
    { name: "GPT-4o", pct: 14, color: "#64748b" },
    { name: "Gemini Pro", pct: 9, color: "#94a3b8" },
    { name: "Other", pct: 5, color: "#cbd5e1" },
  ];

  let cumulative = 0;
  const segments = models.map((m) => {
    const start = cumulative;
    cumulative += m.pct;
    return { ...m, start };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="110" height="110" viewBox="0 0 110 110">
          {segments.map((s) => {
            const r = 48;
            const circumference = 2 * Math.PI * r;
            const offset = circumference - (s.pct / 100) * circumference;
            const rotation = (s.start / 100) * 360 - 90;
            return (
              <circle
                key={s.name}
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={offset}
                transform={`rotate(${rotation} 55 55)`}
                className="transition-all"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">72%</span>
          <span className="text-[9px] text-muted-foreground">one model</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {models.map((m) => (
          <div key={m.name} className="flex items-center gap-2 text-[11px]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
            <span className="text-muted-foreground">{m.name}</span>
            <span className="text-foreground font-semibold ml-auto">{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Demo chart: Cost trend sparkline (SVG) ── */
function CostTrendChart() {
  const before = [4200, 4800, 5100, 5600, 6200, 7100, 7800];
  const after = [7800, 7200, 6100, 5400, 4800, 4100, 3600];
  const all = [...before, ...after];
  const maxY = Math.max(...all);
  const minY = Math.min(...all) * 0.8;
  const w = 280;
  const h = 80;
  const toPoint = (val: number, i: number, total: number) => {
    const x = (i / (total - 1)) * w;
    const y = h - ((val - minY) / (maxY - minY)) * h;
    return `${x},${y}`;
  };
  const beforeLine = before.map((v, i) => toPoint(v, i, all.length)).join(" ");
  const afterLine = after.map((v, i) => toPoint(v, i + before.length, all.length)).join(" ");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 10}`} className="overflow-visible">
        <defs>
          <linearGradient id="beforeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="afterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1616e7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1616e7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={beforeLine} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <polyline points={afterLine} fill="none" stroke="#1616e7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={(before.length - 1) / (all.length - 1) * w} y1="0" x2={(before.length - 1) / (all.length - 1) * w} y2={h + 10} stroke="#64748b" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
        <text x={(before.length - 1) / (all.length - 1) * w} y={h + 10} textAnchor="middle" className="fill-muted-foreground" fontSize="8">
          Plutus enabled
        </text>
      </svg>
      <div className="flex items-center gap-4 mt-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-red-500 opacity-70" />
          <span className="text-muted-foreground">Before</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-brand" />
          <span className="text-muted-foreground">After optimisation</span>
        </div>
        <span className="ml-auto text-green-600 font-semibold flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          54% savings
        </span>
      </div>
    </div>
  );
}

/* ── Showcase card wrapper ── */
function ShowcaseCard({
  icon: Icon,
  label,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 shadow-sm">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-brand-subtle px-2 py-0.5 text-[10px] font-semibold text-brand uppercase tracking-wider mb-3">
          <Icon className="h-3 w-3" />
          {label}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ── Feature pill ── */
function FeaturePill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-[13px] text-foreground shadow-sm">
      <Icon className="h-4 w-4 text-brand shrink-0" />
      {text}
    </div>
  );
}

export function LandingClient() {
  return (
    <div className="min-h-screen flex flex-col bg-sidebar text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(22,22,231,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(22,22,231,0.08),transparent_60%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-10 h-14 shrink-0">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo/symbol.svg"
            alt="Agent Plutus"
            width={28}
            height={28}
            className="brightness-0 invert"
          />
          <Image
            src="/logo/text-white.svg"
            alt="Agent Plutus"
            width={120}
            height={24}
          />
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-light active:scale-[0.97]"
        >
          Log In
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* Main content area */}
      <div className="relative z-10 flex-1 pr-3.5 pb-3.5 pl-3.5 lg:pl-3.5">
        <div className="bg-background rounded-2xl overflow-hidden">

          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none select-none">
              <Image
                src="/logo/symbol.svg"
                alt=""
                width={500}
                height={500}
                aria-hidden="true"
              />
            </div>

            <div className="relative max-w-5xl mx-auto px-6 sm:px-10 pt-20 pb-16 lg:pt-28 lg:pb-20">
              <div className="flex flex-col items-center text-center">
                <div className="mb-8">
                  <Image
                    src="/logo/symbol.svg"
                    alt="Agent Plutus"
                    width={56}
                    height={56}
                  />
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-foreground mb-4">
                  Enterprise AI{" "}
                  <span className="text-brand">Cost Intelligence</span>
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-lg mb-10 leading-relaxed">
                  Monitor, manage, and optimise your organisation&apos;s AI
                  spending across every provider, team, and user.
                </p>

                {/* Provider tags */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1">
                    Integrates with
                  </span>
                  {providers.map((p) => (
                    <span
                      key={p}
                      className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="max-w-5xl mx-auto px-6 sm:px-10">
            <div className="h-px bg-border" />
          </div>

          {/* Showcase: insight cards */}
          <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 lg:py-20">
            <div className="text-center mb-12">
              <p className="text-[11px] font-semibold text-brand uppercase tracking-widest mb-2">
                What you&apos;ll see
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Visibility you can&apos;t get from a billing page
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Agent Plutus turns raw provider invoices into actionable
                insights — by department, team, and individual.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Card 1: Budget overage */}
              <ShowcaseCard
                icon={ShieldAlert}
                label="Budget Alerts"
                title="Catch overages before they compound"
                description="Set budgets by department or team. When spend crosses a threshold, stakeholders are notified instantly — no month-end surprises."
              >
                <BudgetChart />
              </ShowcaseCard>

              {/* Card 2: Model concentration */}
              <ShowcaseCard
                icon={BarChart3}
                label="Usage Insights"
                title="Spot model concentration risk"
                description="See when a user or team relies too heavily on a single model. Diversifying can cut cost and improve output quality."
              >
                <ModelUsageChart />
              </ShowcaseCard>

              {/* Card 3: Cost savings — full width */}
              <div className="md:col-span-2">
                <ShowcaseCard
                  icon={TrendingUp}
                  label="Cost Optimisation"
                  title="Track savings after every optimisation"
                  description="Compare spend before and after policy changes. Agent Plutus quantifies the impact so you can prove ROI to leadership."
                >
                  <CostTrendChart />
                </ShowcaseCard>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="max-w-5xl mx-auto px-6 sm:px-10">
            <div className="h-px bg-border" />
          </div>

          {/* Feature highlights */}
          <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16 lg:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Everything in one place
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                No spreadsheets. No monthly exports. Real-time data from every
                AI provider your organisation uses.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FeaturePill icon={BarChart3} text="Per-user and per-team cost breakdown" />
              <FeaturePill icon={ShieldAlert} text="Anomaly detection and spend alerts" />
              <FeaturePill icon={Users} text="HR directory sync for attribution" />
              <FeaturePill icon={Lightbulb} text="AI-powered optimisation suggestions" />
              <FeaturePill icon={Zap} text="Automated syncing every 6 hours" />
              <FeaturePill icon={TrendingUp} text="Exportable reports and dashboards" />
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-16 lg:pb-20">
            <div className="rounded-xl bg-sidebar text-white p-8 sm:p-10 text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Ready to take control of your AI spend?
              </h2>
              <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
                Deploy on your own infrastructure in minutes. SSO login, encrypted credentials, no data leaves your network.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-brand-light active:scale-[0.97]"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border px-6 sm:px-10 py-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/symbol.svg"
                  alt="Agent Plutus"
                  width={18}
                  height={18}
                  className="opacity-40"
                />
                <span className="text-[11px] text-muted-foreground">
                  &copy; {new Date().getFullYear()} Agent Plutus
                </span>
              </div>
              <a
                href="mailto:contact@agentplutus.com"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                contact@agentplutus.com
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
