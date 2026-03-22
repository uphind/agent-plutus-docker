"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/dashboard-api";
import { Key, Shield, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCurrentKey(getApiKey());
  }, []);

  const handleSave = () => {
    if (newKey.trim()) {
      setApiKey(newKey.trim());
      setCurrentKey(newKey.trim());
      setNewKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleClear = () => {
    if (confirm("Remove your API key? You'll need to re-enter it to use the dashboard.")) {
      clearApiKey();
      setCurrentKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Settings"
        description="Configure your Tokenear dashboard"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle>API Key Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Tokenear organization API key to authenticate dashboard requests.
            This key is stored in your browser&apos;s local storage.
          </p>

          {currentKey ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-sm">
                {currentKey.substring(0, 8)}...{currentKey.substring(currentKey.length - 4)}
              </div>
              <Badge variant="success">Configured</Badge>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Remove
              </Button>
            </div>
          ) : (
            <Badge variant="warning">No API key set</Badge>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="tk_..."
                type="password"
              />
            </div>
            <Button onClick={handleSave} disabled={!newKey.trim()}>
              {currentKey ? "Update Key" : "Save Key"}
            </Button>
          </div>

          {saved && (
            <p className="text-sm text-emerald-600 font-medium">API key saved successfully</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Provider API Keys</p>
              <p className="text-xs text-muted-foreground">Encrypted at rest with AES-256-GCM</p>
            </div>
            <Badge variant="success">Encrypted</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Organization API Key</p>
              <p className="text-xs text-muted-foreground">Hashed with bcrypt (never stored in plaintext)</p>
            </div>
            <Badge variant="success">Hashed</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Sync Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Usage data is automatically synced from all configured providers every 6 hours.
            You can trigger a manual sync from the Providers page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
