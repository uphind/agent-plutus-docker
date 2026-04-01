import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/org";
import { Prisma } from "@/generated/prisma/client";

function getSizeTier(count: number): string {
  if (count <= 50) return "1-50";
  if (count <= 200) return "50-200";
  if (count <= 1000) return "200-1000";
  return "1000+";
}

export async function GET() {
  const orgId = await getOrgId();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUserCount = await prisma.orgUser.count({
    where: { orgId, status: "active" },
  });

  const companySize = getSizeTier(activeUserCount);

  const orgMetrics = await prisma.$queryRaw<
    Array<{
      total_cost: number;
      users_with_usage: number;
      lines_accepted: number;
      lines_suggested: number;
      total_requests: number;
    }>
  >(
    Prisma.sql`SELECT
       COALESCE(SUM(cost_usd), 0)::float AS total_cost,
       COUNT(DISTINCT user_id)::int AS users_with_usage,
       COALESCE(SUM(lines_accepted), 0)::bigint AS lines_accepted,
       COALESCE(SUM(lines_suggested), 0)::bigint AS lines_suggested,
       COALESCE(SUM(requests_count), 0)::bigint AS total_requests
     FROM usage_records
     WHERE org_id = ${orgId} AND date >= ${thirtyDaysAgo}`
  );

  const om = orgMetrics[0];
  const costPerDev = activeUserCount > 0 ? om.total_cost / activeUserCount : 0;
  const acceptRate = Number(om.lines_suggested) > 0
    ? Number(om.lines_accepted) / Number(om.lines_suggested) : 0;
  const costPerLine = Number(om.lines_accepted) > 0
    ? om.total_cost / Number(om.lines_accepted) : 0;

  const providerSpend = await prisma.$queryRaw<
    Array<{ provider: string; spend: number }>
  >(
    Prisma.sql`SELECT provider::text, SUM(cost_usd)::float AS spend
     FROM usage_records
     WHERE org_id = ${orgId} AND date >= ${thirtyDaysAgo}
     GROUP BY provider`
  );

  const totalSpend = providerSpend.reduce((s, p) => s + p.spend, 0);
  const providerMix: Record<string, number> = {};
  for (const p of providerSpend) {
    providerMix[p.provider] = totalSpend > 0 ? p.spend / totalSpend : 0;
  }

  const benchmarks = await prisma.benchmarkSnapshot.findFirst({
    where: { companySize },
    orderBy: { date: "desc" },
  }).catch(() => null);

  const benchmark = benchmarks
    ? {
        company_size: benchmarks.companySize,
        median_cost_per_dev: Number(benchmarks.medianCostPerDev),
        median_accept_rate: Number(benchmarks.medianAcceptRate),
        median_cost_per_line: Number(benchmarks.medianCostPerLine),
        provider_mix: benchmarks.providerMix as Record<string, number>,
        sample_size: benchmarks.sampleSize,
      }
    : {
        company_size: companySize,
        median_cost_per_dev: companySize === "1-50" ? 180 : companySize === "50-200" ? 210 : companySize === "200-1000" ? 250 : 280,
        median_accept_rate: 0.28,
        median_cost_per_line: 0.012,
        provider_mix: { cursor: 0.35, anthropic: 0.30, openai: 0.25, gemini: 0.10 },
        sample_size: 0,
      };

  function compareMetric(yours: number, bench: number): { delta: number; percentDiff: number; assessment: string } {
    const diff = yours - bench;
    const pctDiff = bench > 0 ? (diff / bench) * 100 : 0;
    let assessment = "on par";
    if (pctDiff > 20) assessment = "above";
    else if (pctDiff > 5) assessment = "slightly above";
    else if (pctDiff < -20) assessment = "below";
    else if (pctDiff < -5) assessment = "slightly below";
    return { delta: diff, percentDiff: pctDiff, assessment };
  }

  const costComparison = compareMetric(costPerDev, Number(benchmark.median_cost_per_dev));
  const acceptComparison = compareMetric(acceptRate, Number(benchmark.median_accept_rate));

  const insights: string[] = [];

  if (costComparison.assessment === "above") {
    insights.push(
      `Your cost per developer ($${costPerDev.toFixed(0)}/mo) is ${Math.abs(costComparison.percentDiff).toFixed(0)}% above the median for ${companySize}-employee companies ($${Number(benchmark.median_cost_per_dev).toFixed(0)}/mo).`
    );
  } else if (costComparison.assessment === "below") {
    insights.push(
      `Your cost per developer ($${costPerDev.toFixed(0)}/mo) is ${Math.abs(costComparison.percentDiff).toFixed(0)}% below the median, suggesting efficient AI usage or potential underinvestment.`
    );
  }

  if (acceptRate > 0 && acceptComparison.assessment === "above") {
    insights.push(
      `Your acceptance rate (${(acceptRate * 100).toFixed(1)}%) is above average (${(Number(benchmark.median_accept_rate) * 100).toFixed(1)}%), indicating effective AI adoption.`
    );
  }

  return NextResponse.json({
    companySize,
    activeUsers: activeUserCount,
    yourMetrics: {
      costPerDev,
      acceptRate,
      costPerLine,
      totalCost: om.total_cost,
      providerMix,
    },
    benchmarks: {
      costPerDev: Number(benchmark.median_cost_per_dev),
      acceptRate: Number(benchmark.median_accept_rate),
      costPerLine: Number(benchmark.median_cost_per_line),
      providerMix: benchmark.provider_mix,
      sampleSize: benchmark.sample_size,
      isRealData: benchmark.sample_size > 0,
    },
    comparisons: {
      costPerDev: costComparison,
      acceptRate: acceptComparison,
    },
    insights,
  });
}
