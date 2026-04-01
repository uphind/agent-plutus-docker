"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const DEMO_PASSWORD = "TokenSaver2026";
const STORAGE_KEY = "agent-plutus-demo-auth";

export function DemoGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === "true") setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (checking) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className="h-screen flex flex-col bg-sidebar text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(22,22,231,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(22,22,231,0.08),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo/symbol.svg"
              alt="Agent Plutus"
              width={48}
              height={48}
              className="brightness-0 invert mb-4"
            />
            <Image
              src="/logo/text-white.svg"
              alt="Agent Plutus"
              width={140}
              height={28}
              className="mb-6"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[11px] font-medium text-gray-400">
              <Lock className="h-3 w-3" />
              Demo Access
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="demo-password" className="block text-xs font-medium text-gray-400 mb-1.5">
                Enter demo password
              </label>
              <div className="relative">
                <input
                  id="demo-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Password"
                  autoFocus
                  className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand ${
                    error ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-red-400">Incorrect password. Please try again.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-light active:scale-[0.98]"
            >
              Enter Demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-gray-500">
            Request access at{" "}
            <a href="mailto:contact@agentplutus.com" className="text-gray-400 hover:text-white transition-colors">
              contact@agentplutus.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
