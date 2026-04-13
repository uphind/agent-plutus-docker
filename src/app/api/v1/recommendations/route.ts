import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgIdSafe } from "@/lib/org";
import { processPreAggregated } from "@/lib/classifier";

const EMPTY_RESPONSE = { rows: [], byTeam: {}, summary: null };

interface RawRow {
  user_id: string;
  user_email: string;
  user_name: string;
  department: string;
  team: string;
  team_id: string | null;
  team_name: string | null;
  provider: string;
  model: string;
  total_requests: number;
  total_input: number;
  total_output: number;
  total_cached: number;
  total_cost: number;
  active_days: number;
}

export async function GET(req: NextRequest) {
  const orgId = await getOrgIdSafe();
  if (!orgId) return NextResponse.json(EMPTY_RESPONSE);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const teamId = searchParams.get("teamId");

  let raw: RawRow[];

  if (userId) {
    raw = await prisma.$queryRaw<RawRow[]>`
      SELECT u.id AS user_id, u.email AS user_email, u.name AS user_name,
             COALESCE(u.department, '') AS department, COALESCE(u.team, '') AS team,
             u.team_id, t.name AS team_name,
             ur.provider::text AS provider, COALESCE(ur.model, 'unknown') AS model,
             SUM(ur.requests_count)::int AS total_requests,
             SUM(ur.input_tokens)::float AS total_input,
             SUM(ur.output_tokens)::float AS total_output,
             SUM(ur.cached_tokens)::float AS total_cached,
             SUM(ur.cost_usd)::float AS total_cost,
             COUNT(DISTINCT ur.date)::int AS active_days
      FROM usage_records ur
      JOIN org_users u ON ur.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE ur.org_id = ${orgId} AND ur.date >= ${thirtyDaysAgo}
        AND ur.model IS NOT NULL AND u.id = ${userId}
      GROUP BY u.id, u.email, u.name, u.department, u.team, u.team_id, t.name, ur.provider, ur.model
      HAVING SUM(ur.cost_usd)::float > 1
    `;
  } else if (teamId) {
    raw = await prisma.$queryRaw<RawRow[]>`
      SELECT u.id AS user_id, u.email AS user_email, u.name AS user_name,
             COALESCE(u.department, '') AS department, COALESCE(u.team, '') AS team,
             u.team_id, t.name AS team_name,
             ur.provider::text AS provider, COALESCE(ur.model, 'unknown') AS model,
             SUM(ur.requests_count)::int AS total_requests,
             SUM(ur.input_tokens)::float AS total_input,
             SUM(ur.output_tokens)::float AS total_output,
             SUM(ur.cached_tokens)::float AS total_cached,
             SUM(ur.cost_usd)::float AS total_cost,
             COUNT(DISTINCT ur.date)::int AS active_days
      FROM usage_records ur
      JOIN org_users u ON ur.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE ur.org_id = ${orgId} AND ur.date >= ${thirtyDaysAgo}
        AND ur.model IS NOT NULL AND u.team_id = ${teamId}
      GROUP BY u.id, u.email, u.name, u.department, u.team, u.team_id, t.name, ur.provider, ur.model
      HAVING SUM(ur.cost_usd)::float > 1
    `;
  } else {
    raw = await prisma.$queryRaw<RawRow[]>`
      SELECT u.id AS user_id, u.email AS user_email, u.name AS user_name,
             COALESCE(u.department, '') AS department, COALESCE(u.team, '') AS team,
             u.team_id, t.name AS team_name,
             ur.provider::text AS provider, COALESCE(ur.model, 'unknown') AS model,
             SUM(ur.requests_count)::int AS total_requests,
             SUM(ur.input_tokens)::float AS total_input,
             SUM(ur.output_tokens)::float AS total_output,
             SUM(ur.cached_tokens)::float AS total_cached,
             SUM(ur.cost_usd)::float AS total_cost,
             COUNT(DISTINCT ur.date)::int AS active_days
      FROM usage_records ur
      JOIN org_users u ON ur.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE ur.org_id = ${orgId} AND ur.date >= ${thirtyDaysAgo}
        AND ur.model IS NOT NULL
      GROUP BY u.id, u.email, u.name, u.department, u.team, u.team_id, t.name, ur.provider, ur.model
      HAVING SUM(ur.cost_usd)::float > 1
    `;
  }

  if (raw.length === 0) {
    return NextResponse.json({ rows: [], byTeam: {}, summary: null });
  }

  const classifierInput = raw.map((r) => ({
    user_email: r.user_email,
    user_name: r.user_name,
    department: r.department,
    team: r.team,
    provider: r.provider,
    model: r.model,
    input_tokens: r.total_input,
    output_tokens: r.total_output,
    cached_tokens: r.total_cached,
    cost_usd: r.total_cost,
    requests_count: r.total_requests,
    date: undefined,
  }));

  const { rows: recommended, summary } = processPreAggregated(
    classifierInput as unknown as Array<Record<string, unknown>>
  );

  const enriched = recommended.map((rec, i) => ({
    ...rec,
    user_id: raw[i].user_id,
    team_id: raw[i].team_id,
    team_name: raw[i].team_name,
  }));

  const byTeam: Record<string, {
    team_id: string | null;
    team_name: string;
    totalSavingsGlobal: number;
    totalSavingsSameVendor: number;
    totalCost: number;
    users: typeof enriched;
  }> = {};

  for (const row of enriched) {
    const key = row.team_id ?? "__unassigned__";
    if (!byTeam[key]) {
      byTeam[key] = {
        team_id: row.team_id,
        team_name: row.team_name ?? "Unassigned",
        totalSavingsGlobal: 0,
        totalSavingsSameVendor: 0,
        totalCost: 0,
        users: [],
      };
    }
    byTeam[key].totalCost += row.total_cost_usd;
    if (row.is_cheaper_global) byTeam[key].totalSavingsGlobal += row.est_savings_global_usd ?? 0;
    if (row.is_cheaper_same_vendor) byTeam[key].totalSavingsSameVendor += row.est_savings_same_vendor_usd ?? 0;
    byTeam[key].users.push(row);
  }

  return NextResponse.json({ rows: enriched, byTeam, summary });
}
