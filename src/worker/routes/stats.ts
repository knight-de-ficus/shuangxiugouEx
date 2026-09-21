import { Hono } from "hono";
import type { AppEnv } from "../types/bindings";

type VoteRow = { company_id: string; upvotes: number; boycotts: number };
type ReportRow = {
  id: string;
  company_id: string;
  role: string;
  weekend_rating: number;
  off_work_time: string;
  statutory_pay: number;
  comment: string;
  created_at: string;
};

export const statsRoutes = new Hono<AppEnv>();

statsRoutes.get("/", async (context) => {
  const [pledgesResult, votesResult, reportsResult] = await context.env.DB.batch([
    context.env.DB.prepare("SELECT COALESCE(SUM(p.amount_cents), 0) AS total_cents FROM purchase_pledges p INNER JOIN catalog_companies c ON c.id = p.company_id"),
    context.env.DB.prepare(
      "SELECT v.company_id, SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END) AS upvotes, SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END) AS boycotts FROM brand_votes v INNER JOIN catalog_companies c ON c.id = v.company_id GROUP BY v.company_id",
    ),
    context.env.DB.prepare(
      "SELECT r.id, r.company_id, r.role, r.weekend_rating, r.off_work_time, r.statutory_pay, r.comment, r.created_at FROM employee_reports r INNER JOIN catalog_companies c ON c.id = r.company_id ORDER BY r.created_at DESC LIMIT ?",
    ).bind(1000),
  ]);

  const totalCents = Number((pledgesResult.results[0] as { total_cents: number } | undefined)?.total_cents ?? 0);
  const votes = Object.fromEntries(
    (votesResult.results as VoteRow[]).map((row) => [
      row.company_id,
      { upvotes: Number(row.upvotes), boycotts: Number(row.boycotts) },
    ]),
  );

  const groupedReports = new Map<string, ReportRow[]>();
  for (const report of reportsResult.results as ReportRow[]) {
    const group = groupedReports.get(report.company_id) ?? [];
    group.push(report);
    groupedReports.set(report.company_id, group);
  }
  const employeeStats = Object.fromEntries(
    Array.from(groupedReports, ([id, reports]) => {
      const total = reports.length;
      const latest = reports[0];
      return [
        id,
        {
          realDoubleWeekendRate: Math.round(reports.reduce((sum, item) => sum + item.weekend_rating, 0) / total),
          avgOffWorkTime: latest.off_work_time,
          hasStatutoryPayRate: Math.round((reports.reduce((sum, item) => sum + item.statutory_pay, 0) / total) * 100),
          totalEmployeeVotes: total,
          anonymousComments: reports
            .filter((item) => item.comment)
            .slice(0, 20)
            .map((item) => ({
              id: item.id,
              role: item.role,
              verifiedStatus: "community_unverified",
              comment: item.comment,
              date: item.created_at.slice(0, 10),
              voteType: item.weekend_rating >= 60 ? "supports_double" : "reports_overtime",
            })),
        },
      ];
    }),
  );

  return context.json({ transferredAmount: Math.round(totalCents / 100), votes, employeeStats });
});
