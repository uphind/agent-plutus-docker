import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { getAdapter } from "@/lib/providers";
import { Provider } from "@/generated/prisma/client";

export async function syncProvider(orgId: string, provider: Provider) {
  const credential = await prisma.providerCredential.findUnique({
    where: { orgId_provider: { orgId, provider } },
  });

  if (!credential || !credential.isActive) {
    throw new Error(`No active credential for ${provider}`);
  }

  const syncLog = await prisma.syncLog.create({
    data: { orgId, provider, status: "running" },
  });

  try {
    const apiKey = decrypt(credential.encryptedApiKey);
    const adapter = getAdapter(provider);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const records = await adapter.fetchUsage(apiKey, startDate, endDate);

    // Match user references to org users
    const orgUsers = await prisma.orgUser.findMany({
      where: { orgId },
      select: { id: true, email: true, employeeId: true },
    });

    const emailIndex = new Map<string, string>(orgUsers.map((u) => [u.email, u.id]));
    const empIdIndex = new Map<string, string>(
      orgUsers
        .filter((u): u is typeof u & { employeeId: string } => !!u.employeeId)
        .map((u) => [u.employeeId, u.id])
    );

    for (const record of records) {
      let resolvedUserId: string | null = null;

      if (record.userRef) {
        resolvedUserId =
          emailIndex.get(record.userRef) ??
          empIdIndex.get(record.userRef) ??
          null;
      }

      await prisma.usageRecord.create({
        data: {
          orgId,
          userId: resolvedUserId,
          provider: record.provider,
          model: record.model,
          date: record.date,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          cachedTokens: record.cachedTokens,
          requestsCount: record.requestsCount,
          costUsd: record.costUsd,
          linesAccepted: record.linesAccepted ?? null,
          linesSuggested: record.linesSuggested ?? null,
          acceptRate: record.acceptRate ?? null,
          metadata: record.metadata ? JSON.parse(JSON.stringify(record.metadata)) : undefined,
        },
      });
    }

    await prisma.providerCredential.update({
      where: { id: credential.id },
      data: { lastSyncAt: new Date() },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "success", finishedAt: new Date(), message: `Synced ${records.length} records` },
    });

    return { success: true, recordsCount: records.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "error", finishedAt: new Date(), message },
    });
    throw error;
  }
}

export async function syncAllProviders(orgId: string) {
  const credentials = await prisma.providerCredential.findMany({
    where: { orgId, isActive: true },
  });

  const results: Record<string, { success: boolean; records?: number; error?: string }> = {};

  for (const cred of credentials) {
    try {
      const result = await syncProvider(orgId, cred.provider);
      results[cred.provider] = { success: true, records: result.recordsCount };
    } catch (error) {
      results[cred.provider] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return results;
}
