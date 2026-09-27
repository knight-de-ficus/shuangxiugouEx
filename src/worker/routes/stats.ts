import { Hono } from "hono";
import type { AppEnv } from "../types/bindings";

type SnapshotRow = {
  transferred_amount_cents: number;
  votes_json: string;
  employee_stats_json: string;
};

type StoredEmployeeStats = {
  realDoubleWeekendRate: number;
  avgOffWorkTime: string;
  hasStatutoryPayRate: number;
  totalEmployeeVotes: number;
  totalObservedWeeks?: number;
  totalDoubleRestWeeks?: number;
  avgWeeklyHours?: number;
  anonymousComments: Array<Record<string, unknown>>;
  _weekendRatingSum?: number;
  _statutoryPayCount?: number;
};

export const statsRoutes = new Hono<AppEnv>();

statsRoutes.get("/", async (context) => {
  const snapshot = await context.env.DB.prepare(
    "SELECT transferred_amount_cents, votes_json, employee_stats_json FROM public_stats_snapshot WHERE id = 1",
  ).first<SnapshotRow>();

  const votes = JSON.parse(snapshot?.votes_json ?? "{}") as Record<string, { upvotes: number; boycotts: number }>;
  const storedEmployeeStats = JSON.parse(snapshot?.employee_stats_json ?? "{}") as Record<string, StoredEmployeeStats>;
  const employeeStats = Object.fromEntries(
    Object.entries(storedEmployeeStats).map(([companyId, stats]) => [
      companyId,
      {
        realDoubleWeekendRate: stats.realDoubleWeekendRate,
        avgOffWorkTime: stats.avgOffWorkTime,
        hasStatutoryPayRate: stats.hasStatutoryPayRate,
        totalEmployeeVotes: stats.totalEmployeeVotes,
        totalObservedWeeks: stats.totalObservedWeeks ?? 0,
        totalDoubleRestWeeks: stats.totalDoubleRestWeeks ?? 0,
        avgWeeklyHours: stats.avgWeeklyHours,
        anonymousComments: [...(stats.anonymousComments ?? [])].reverse(),
      },
    ]),
  );

  context.header("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
  return context.json({
    transferredAmount: Math.round(Number(snapshot?.transferred_amount_cents ?? 0) / 100),
    votes,
    employeeStats,
  });
});
