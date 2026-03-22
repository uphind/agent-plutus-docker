import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";
import bcryptjs from "bcryptjs";

export async function validateApiKey(
  request: NextRequest
): Promise<{ orgId: string } | NextResponse> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing X-API-Key header" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    select: { id: true, apiKeyHash: true },
  });

  for (const org of orgs) {
    const match = await bcryptjs.compare(apiKey, org.apiKeyHash);
    if (match) {
      return { orgId: org.id };
    }
  }

  return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
}

export function isAuthError(
  result: { orgId: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

export async function hashApiKey(key: string): Promise<string> {
  return bcryptjs.hash(key, 10);
}
