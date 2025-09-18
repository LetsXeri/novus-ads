import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";
import { pickWeightedAlias } from "./utils/aliasSampler";

const router = Router();

// GET /placements
router.get("/", (_req, res) => {
	try {
		const stmt = db.prepare("SELECT * FROM placements ORDER BY createdAt DESC");
		const placements = stmt.all();
		res.json(placements);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Fehler beim Abrufen");
	}
});

// POST /placements
router.post("/", (req, res) => {
	const { name, status } = req.body;
	if (!name) return res.status(400).json({ error: "Name fehlt" });

	try {
		const stmt = db.prepare(`
      INSERT INTO placements (name, status, createdAt, totalEarnings)
      VALUES (?, ?, datetime('now'), 0)
    `);
		const result = stmt.run(name, status);
		res.status(201).json({
			id: result.lastInsertRowid,
			name,
			status: status ?? "Aktiv",
			totalEarnings: 0,
		});
	} catch (err) {
		console.error("❌ Fehler beim Erstellen:", err);
		res.status(500).send("Fehler beim Erstellen");
	}
});

// PUT /placements/:id
router.put("/:id", (req, res) => {
	const { id } = req.params;
	const { name, status } = req.body;

	if (!name && !status) {
		return res.status(400).json({ error: "Name oder Status muss angegeben werden" });
	}

	const fields: string[] = [];
	const values: any[] = [];

	if (typeof name === "string") {
		fields.push("name = ?");
		values.push(name);
	}
	if (typeof status === "string") {
		fields.push("status = ?");
		values.push(status);
	}

	const sql = `UPDATE placements SET ${fields.join(", ")} WHERE id = ?`;
	values.push(id);

	try {
		const stmt = db.prepare(sql);
		const result = stmt.run(...values);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Placement nicht gefunden" });
		}

		res.json({ id, updatedFields: fields.map((f) => f.split(" = ")[0]) });
	} catch (err) {
		console.error("❌ Fehler beim Aktualisieren:", err);
		res.status(500).send("Fehler beim Aktualisieren");
	}
});

// DELETE /placements/:id
router.delete("/:id", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare("DELETE FROM placements WHERE id = ?");
		const result = stmt.run(id);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Placement nicht gefunden" });
		}

		res.status(204).send();
	} catch (err) {
		console.error("❌ Fehler beim Löschen:", err);
		res.status(500).send("Fehler beim Löschen");
	}
});

// GET /placements/:id/earnings
router.get("/:id/earnings", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare(`
      SELECT year, month, amount
      FROM placement_earnings
      WHERE placementId = ?
      ORDER BY year DESC, month DESC
    `);
		const earnings = stmt.all(id);
		res.json(earnings);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen der Einnahmen:", err);
		res.status(500).send("Fehler beim Abrufen");
	}
});

function computeCostPerCall(limit: number | null, budget: number | null): number {
	if (limit !== null && limit > 0 && budget !== null) return budget / limit;
	return 0;
}

// GET /placements/:id/redirect
// - Filtert Ads nach Budget/Limit/RateLimit
// - Wählt gewichtet via O(1)-Alias-Sampling
// - Verbucht atomar: calls, budget, earnings (monatlich), daily KPIs
router.get("/:id/redirect", (req, res) => {
	const { id } = req.params;

	try {
		const windowStart = Math.floor(Date.now() / 60000);

		// Kandidaten mit RateLimit-Check
		const stmt = db.prepare(`
      SELECT a.*
      FROM ads a
      LEFT JOIN ad_rate_counters c
        ON c.adId = a.id AND c.windowStart = ?
      WHERE a.placementId = ?
        AND (a."limit" IS NULL OR (a."limit" > 0 AND a.calls < a."limit"))
        AND (a.budget IS NULL OR a.budget > 0)
        AND a.weight > 0
        AND (
          a.rateLimitPerMinute IS NULL
          OR c.count IS NULL
          OR c.count < a.rateLimitPerMinute
        )
    `);
		const ads = stmt.all(windowStart, id) as Ad[];

		if (ads.length === 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// Gewählte Ad via Alias-Sampling (kein direkter new AliasSampler(...))
		const chosen = pickWeightedAlias(ads, (a) => (a.weight > 0 ? a.weight : 0));
		if (!chosen) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// defensive: limit=0 nicht ausspielen
		if (chosen.limit !== null && chosen.limit <= 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		const { id: adId, limit, budget, placementId, rateLimitPerMinute } = chosen;
		const callCost = computeCostPerCall(limit, budget);

		// Atomare Buchung in einer Transaktion
		const tx = db.transaction((costPerCall: number) => {
			// 1) RateCounter upsert (mit Limit)
			if (rateLimitPerMinute !== null) {
				const up = db
					.prepare(
						`
          INSERT INTO ad_rate_counters (adId, windowStart, count)
          VALUES (?, ?, 1)
          ON CONFLICT(adId, windowStart)
          DO UPDATE SET count = count + 1
          WHERE count < ?
        `
					)
					.run(adId, windowStart, rateLimitPerMinute);

				if (up.changes === 0) {
					// Limit erreicht, nicht ausspielen
					return { ok: false as const };
				}
			} else {
				// optionales Tracking ohne Obergrenze
				db.prepare(
					`
          INSERT INTO ad_rate_counters (adId, windowStart, count)
          VALUES (?, ?, 1)
          ON CONFLICT(adId, windowStart)
          DO UPDATE SET count = count + 1
        `
				).run(adId, windowStart);
			}

			// 2) Calls & Budget (nicht ins Negative, Limit beachten)
			const upd = db
				.prepare(
					`
        UPDATE ads
        SET calls = calls + 1,
            budget = CASE
              WHEN budget IS NOT NULL AND "limit" IS NOT NULL AND "limit" > 0
                THEN MAX(0, budget - ?)
              ELSE budget
            END
        WHERE id = ?
          AND ("limit" IS NULL OR calls < "limit")
          AND (budget IS NULL OR budget - ? >= 0)
      `
				)
				.run(costPerCall, adId, costPerCall);

			if (upd.changes === 0) {
				return { ok: false as const };
			}

			// 3) Earnings & KPIs (nur wenn Placement bekannt)
			if (placementId !== null) {
				const now = new Date();
				const year = now.getFullYear();
				const month = now.getMonth() + 1;
				const dateStr = now.toISOString().slice(0, 10); // yyyy-mm-dd

				// totalEarnings & monatliche Einnahmen nur bei positiver Buchung
				if (costPerCall > 0) {
					db.prepare(
						`
            UPDATE placements
            SET totalEarnings = totalEarnings + ?
            WHERE id = ?
          `
					).run(costPerCall, placementId);

					db.prepare(
						`
            INSERT INTO placement_earnings (placementId, year, month, amount)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(placementId, year, month)
            DO UPDATE SET amount = amount + excluded.amount
          `
					).run(placementId, year, month, costPerCall);
				}

				// Daily KPIs (calls immer +1, earnings ggf. +0)
				db.prepare(
					`
          INSERT INTO placement_daily_kpis (placementId, date, earnings, calls)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(placementId, date)
          DO UPDATE SET
            earnings = earnings + excluded.earnings,
            calls = calls + 1
        `
				).run(placementId, dateStr, costPerCall);
			}

			return { ok: true as const };
		});

		const outcome = tx(callCost);
		if (!outcome.ok) {
			return res.status(404).send("Kein Target verfügbar");
		}

		return res.redirect(302, chosen.url);
	} catch (err) {
		console.error("❌ Fehler beim Redirect:", err);
		res.status(500).send("Fehler beim Redirect");
	}
});

export default router;
