import { Router } from "express";
import { db } from "./db";

const router = Router();

function isISODate(s: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function defaultRange(): { from: string; to: string } {
	const to = new Date();
	const from = new Date(to);
	from.setDate(to.getDate() - 13); // 14 Tage inkl. heute
	const fmt = (d: Date) => d.toISOString().slice(0, 10);
	return { from: fmt(from), to: fmt(to) };
}

/**
 * GET /api/v1/analytics/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Rückgabe: [{date, placementId, placementName, earnings, calls}]
 */
router.get("/daily", (req, res) => {
	try {
		const { from: qFrom, to: qTo } = req.query as { from?: string; to?: string };
		const { from, to } = qFrom && isISODate(qFrom) && qTo && isISODate(qTo) ? { from: qFrom, to: qTo } : defaultRange();

		const rows = db
			.prepare(
				`
      SELECT k.date as date,
             k.placementId as placementId,
             p.name as placementName,
             k.earnings as earnings,
             k.calls as calls
      FROM placement_daily_kpis k
      JOIN placements p ON p.id = k.placementId
      WHERE k.date BETWEEN ? AND ?
      ORDER BY k.date ASC, p.name ASC
    `
			)
			.all(from, to);

		res.json(rows);
	} catch (err) {
		console.error("❌ Fehler bei /analytics/daily:", err);
		res.status(500).json({ error: "Fehler bei der Analyse" });
	}
});

export default router;
