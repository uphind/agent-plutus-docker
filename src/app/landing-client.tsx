"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Lock,
  Mail,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Usage Analytics",
    desc: "Track AI spend across teams and departments with real-time dashboards and historical trends.",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Monitor per-user and per-team consumption. Identify heavy users and optimise allocation.",
  },
  {
    icon: Shield,
    title: "Budget Controls",
    desc: "Set spending limits and automated alerts before costs spiral. Stay within budget, always.",
  },
  {
    icon: Zap,
    title: "Real-time Sync",
    desc: "Automated data ingestion from Anthropic, OpenAI, Cursor, Gemini, and Vertex AI.",
  },
];

const providers = ["Anthropic", "OpenAI", "Cursor", "Gemini", "Vertex AI"];

export function LandingClient() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(22,22,231,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(22,22,231,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,22,231,0.04),transparent_70%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/symbol.svg"
            alt="Agent Plutus"
            width={32}
            height={32}
            className="brightness-0 invert"
          />
          <Image
            src="/logo/text-white.svg"
            alt="Agent Plutus"
            width={130}
            height={26}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowComingSoon((v) => !v)}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 border border-white/15 hover:border-white/30 hover:text-white transition-colors cursor-default"
            >
              <Lock className="h-3.5 w-3.5" />
              Log In
            </button>
            {showComingSoon && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow-lg">
                Coming Soon
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-white" />
              </div>
            )}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1616e7" }}
          >
            View Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-10 pt-10 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live demo available
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Enterprise AI
          <br />
          <span style={{ color: "#1616e7" }}>Cost Intelligence</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Monitor, manage, and optimise your organisation&apos;s AI spending
          across every provider, team, and user &mdash; all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1616e7]/25"
            style={{ backgroundColor: "#1616e7" }}
          >
            View Demo
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowComingSoon((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold border border-white/15 text-gray-300 hover:border-white/30 hover:text-white transition-colors cursor-default"
            >
              <Lock className="h-3.5 w-3.5" />
              Log In
            </button>
            {showComingSoon && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow-lg">
                Coming Soon
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-white" />
              </div>
            )}
          </div>

          <a
            href="mailto:contact@agentplutus.com"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </a>
        </div>

        {/* Provider pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Integrates with</span>
          {providers.map((p) => (
            <span
              key={p}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 sm:px-10 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-white/15 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-[#1616e7]/15 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-[#1616e7]" style={{ color: "#6366f1" }} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8 py-8 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo/symbol.svg"
              alt="Agent Plutus"
              width={20}
              height={20}
              className="brightness-0 invert opacity-50"
            />
            <span className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Agent Plutus
            </span>
          </div>
          <a
            href="mailto:contact@agentplutus.com"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            contact@agentplutus.com
          </a>
        </div>
      </footer>
    </div>
  );
}
