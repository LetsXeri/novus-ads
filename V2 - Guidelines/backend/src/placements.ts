import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";

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

/** Kosten pro Aufruf berechnen
 * Nur wenn limit > 0 und budget != NULL.
 * Hinweis: Das ist euer bestehendes Modell (budget/limit); wird hier beibehalten.
 */
function computeCostPerCall(limit: number | null, budget: number | null): number {
	if (limit !== null && limit > 0 && budget !== null) {
		return budget / limit;
	}
	return 0;
}

/** Weighted-Roulette */
function pickWeighted<T extends { weight: number }>(items: T[]): T | null {
	const total = items.reduce((s, i) => s + i.weight, 0);
	if (total <= 0) return null;
	const r = Math.random() * total;
	let acc = 0;
	for (const it of items) {
		acc += it.weight;
		if (r <= acc) return it;
	}
	return null;
}

/**
 * GET /placements/:id/redirect
 * Atomare Buchung: kein negativer Budgetstand, kein Redirect bei limit=0,
 * und nur wenn verfügbares Budget die Buchung deckt.
 */
router.get("/:id/redirect", (req, res) => {
	const { id } = req.params;

	try {
		// Kandidaten lesen: limit>0 & calls<limit, budget NULL/oder >0 (Affordability check folgt in TX)
		const stmt = db.prepare(`
      SELECT * FROM ads
      WHERE placementId = ?
        AND ("limit" IS NULL OR ("limit" > 0 AND calls < "limit"))
        AND (budget IS NULL OR budget > 0)
    `);
		const ads = stmt.all(id) as Ad[];

		if (ads.length === 0) {
			return res.status(404).send("Kein Target verfügbar");
		}

		// Auswahl
		const chosen = pickWeighted(ads);
		if (!chosen) return res.status(404).send("Kein Target verfügbar");

		// Buchung atomar (BEGIN IMMEDIATE sperrt früh, verhindert Race Conditions)
		const tx = db.transaction((ad: Ad) => {
			const { id: adId, limit, budget, placementId } = ad;

			const costPerCall = computeCostPerCall(limit, budget);

			// Bedingtes Update schützt gegen Unterläufe & Rennen:
			// - limit (falls vorhanden) noch nicht überschritten
			// - budget (falls vorhanden) ausreichend für Buchung
			const result = db
				.prepare(
					`
        UPDATE ads
        SET calls = calls + 1,
            budget = CASE
              WHEN budget IS NOT NULL AND "limit" IS NOT NULL AND "limit" > 0
                THEN budget - ?
              ELSE budget
            END
        WHERE id = ?
          AND ("limit" IS NULL OR calls < "limit")
          AND (budget IS NULL OR budget - ? >= 0)
      `
				)
				.run(costPerCall, adId, costPerCall);

			if (result.changes === 0) {
				// Nicht (mehr) verfügbar oder Budget nicht ausreichend
				return { ok: false as const };
			}

			// Einnahmen nur buchen, wenn wirklich Kosten angefallen sind
			if (placementId !== null && costPerCall > 0) {
				const now = new Date();
				const year = now.getFullYear();
				const month = now.getMonth() + 1;

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

			return { ok: true as const, url: ad.url };
		});

		const outcome = tx(chosen);

		if (!outcome.ok) {
			// Fallback: Ein anderer Request war schneller; melde klar "Kein Target verfügbar"
			return res.status(404).send("Kein Target verfügbar");
		}

		return res.redirect(302, outcome.url!);
	} catch (err) {
		console.error("❌ Fehler beim Redirect:", err);
		res.status(500).send("Fehler beim Redirect");
	}
});

export default router;
