import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateApiKey, isAuthError } from "@/lib/auth";
import { syncProvider, syncAllProviders } from "@/lib/sync/sync-engine";
import { Provider } from "@/generated/prisma/client";

const syncSchema = z.object({
  provider: z.nativeEnum(Provider).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (isAuthError(auth)) return auth;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // No body = sync all
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.provider) {
      const result = await syncProvider(auth.orgId, parsed.data.provider);
      return NextResponse.json({ success: true, provider: parsed.data.provider, recordsCount: result.recordsCount });
    } else {
      const results = await syncAllProviders(auth.orgId);
      return NextResponse.json({ success: true, results });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (isAuthError(auth)) return auth;

  const logs = await prisma.syncLog.findMany({
    where: { orgId: auth.orgId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ logs });
}
