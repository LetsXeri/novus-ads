import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";
import { pickWeightedAlias } from "./utils/aliasSampler";

const router = Router();

// ... (GET/POST/PUT/DELETE/earnings wie zuvor) ...

function computeCostPerCall(limit: number | null, budget: number | null): number {
	if (limit !== null && limit > 0 && budget !== null) return budget / limit;
	return 0;
}

router.get("/:id/redirect", (req, res) => {
	const { id } = req.params;

	try {
		// Aktuelles Zeitfenster (Unix-Minute)
		const windowStart = Math.floor(Date.now() / 60000);

		// Kandidaten: Limit, Budget, Gewicht und RateLimit berücksichtigen
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

		// O(1) Sampling mit Alias-Methode
		const chosen = pickWeightedAlias(ads, (a) => a.weight);
		if (!chosen) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// defensive Checks
		if (chosen.limit !== null && chosen.limit <= 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		const { id: adId, limit, budget, placementId, rateLimitPerMinute } = chosen;
		const costPerCall = computeCostPerCall(limit, budget);

		const tx = db.transaction((callCost: number) => {
			// 1) Rate Counter upsert – nur erhöhen, wenn unter Limit
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
					// Limit erreicht — nicht ausspielen
					return { ok: false as const };
				}
			} else {
				// unlimited: zeile anlegen/erhöhen ohne Obergrenze (nur als Telemetrie, optional)
				db.prepare(
					`
          INSERT INTO ad_rate_counters (adId, windowStart, count)
          VALUES (?, ?, 1)
          ON CONFLICT(adId, windowStart)
          DO UPDATE SET count = count + 1
        `
				).run(adId, windowStart);
			}

			// 2) Ad calls & Budget aktualisieren (mit Sicherheitsbedingungen)
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
				.run(callCost, adId, callCost);

			if (upd.changes === 0) {
				return { ok: false as const };
			}

			// 3) Earnings buchen
			if (placementId !== null && callCost > 0) {
				const now = new Date();
				const year = now.getFullYear();
				const month = now.getMonth() + 1;

				db.prepare(
					`
          UPDATE placements
          SET totalEarnings = totalEarnings + ?
          WHERE id = ?
        `
				).run(callCost, placementId);

				db.prepare(
					`
          INSERT INTO placement_earnings (placementId, year, month, amount)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(placementId, year, month)
          DO UPDATE SET amount = amount + excluded.amount
        `
				).run(placementId, year, month, callCost);
			}

			return { ok: true as const };
		});

		const outcome = tx(costPerCall);
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
