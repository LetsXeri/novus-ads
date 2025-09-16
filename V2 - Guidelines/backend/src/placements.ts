import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";
import { pickWeightedAlias } from "./utils/aliasSampler";

const router = Router();

// GET /placements
router.get("/", (req, res) => {
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
			status,
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

		res.status(204).send(); // No Content
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

/** Kosten pro Aufruf berechnen.
 * Nur wenn limit > 0 und budget != NULL.
 */
function computeCostPerCall(limit: number | null, budget: number | null): number {
	if (limit !== null && limit > 0 && budget !== null) {
		return budget / limit;
	}
	return 0;
}

/**
 * GET /placements/:id/redirect
 * Optimierte Weighted Selection via Vose (Alias-Methode).
 * - Exkludiert Ads mit limit = 0, weight <= 0 oder leerem Budget (falls gesetzt).
 * - Bleibt atomar (Transaktion) und sicher gegen Budget-Unterlauf.
 */
router.get("/:id/redirect", (req, res) => {
	const { id } = req.params;

	try {
		// Kandidaten abrufen:
		const stmt = db.prepare(`
      SELECT * FROM ads
      WHERE placementId = ?
        AND ("limit" IS NULL OR ("limit" > 0 AND calls < "limit"))
        AND (budget IS NULL OR budget > 0)
        AND weight > 0
    `);
		const ads = stmt.all(id) as Ad[];

		if (ads.length === 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// O(n) Preprocessing, O(1) Sampling
		const chosen = pickWeightedAlias(ads, (a) => a.weight);
		if (!chosen) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// Defensive Absicherung (bei parallelen Updates)
		if (chosen.limit !== null && chosen.limit <= 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		const { id: adId, limit, budget, placementId } = chosen;
		const costPerCall = computeCostPerCall(limit, budget);

		// Atomare Buchung
		const tx = db.transaction((callCost: number) => {
			const result = db
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

			if (result.changes === 0) {
				return { ok: false as const };
			}

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
