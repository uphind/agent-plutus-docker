import { prisma } from "./db";

let cachedOrgId: string | null = null;

export async function getOrgId(): Promise<string> {
  if (cachedOrgId) return cachedOrgId;
  const org = await prisma.organization.findFirstOrThrow();
  cachedOrgId = org.id;
  return cachedOrgId;
}

export async function getOrgIdSafe(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;
  const org = await prisma.organization.findFirst();
  if (!org) return null;
  cachedOrgId = org.id;
  return cachedOrgId;
}
