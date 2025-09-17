import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";

const router = Router();

function parseNullableNumber(v: unknown): number | null | undefined {
	if (v === null) return null;
	if (v === undefined) return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

// GET /api/v1/ads
router.get("/", (_req, res) => {
	try {
		const stmt = db.prepare("SELECT * FROM ads ORDER BY createdAt DESC");
		const ads = stmt.all() as Ad[];
		res.json(ads);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Fehler beim Abrufen der Ads");
	}
});

// POST /api/v1/ads
router.post("/", (req, res) => {
	const { url, weight } = req.body;
	const limit = parseNullableNumber(req.body?.limit) ?? null;
	const placementId = parseNullableNumber(req.body?.placementId) ?? null;
	const budget = parseNullableNumber(req.body?.budget) ?? null;
	const rateLimitPerMinute = parseNullableNumber(req.body?.rateLimitPerMinute) ?? null;

	if (!url || typeof weight !== "number") {
		return res.status(400).json({ error: "url und weight sind Pflichtfelder" });
	}
	if (budget !== null && budget < 0) {
		return res.status(400).json({ error: "Budget darf nicht negativ sein" });
	}
	if (limit !== null && limit < 0) {
		return res.status(400).json({ error: "Limit darf nicht negativ sein" });
	}
	if (rateLimitPerMinute !== null && rateLimitPerMinute < 0) {
		return res.status(400).json({ error: "rateLimitPerMinute darf nicht negativ sein" });
	}

	try {
		const stmt = db.prepare(`
      INSERT INTO ads (url, weight, "limit", calls, placementId, budget, initialBudget, createdAt, rateLimitPerMinute)
      VALUES (?, ?, ?, 0, ?, ?, ?, datetime('now'), ?)
    `);
		const result = stmt.run(url, weight, limit, placementId, budget, budget, rateLimitPerMinute);

		res.status(201).json({
			id: result.lastInsertRowid,
			url,
			weight,
			limit,
			calls: 0,
			placementId,
			budget,
			initialBudget: budget,
			createdAt: new Date().toISOString(),
			rateLimitPerMinute,
		} as Ad);
	} catch (err) {
		console.error("❌ Fehler beim Anlegen:", err);
		res.status(500).send("Fehler beim Anlegen der Ad");
	}
});

// PUT /api/v1/ads/:id
router.put("/:id", (req, res) => {
	const { id } = req.params;

	const url = typeof req.body?.url === "string" ? req.body.url : undefined;
	const weight = typeof req.body?.weight === "number" ? req.body.weight : undefined;
	const calls = typeof req.body?.calls === "number" ? req.body.calls : undefined;
	const limit = parseNullableNumber(req.body?.limit);
	const budget = parseNullableNumber(req.body?.budget);
	const placementId = parseNullableNumber(req.body?.placementId);
	const rateLimitPerMinute = parseNullableNumber(req.body?.rateLimitPerMinute);

	const fields: string[] = [];
	const values: any[] = [];

	if (url !== undefined) {
		fields.push("url = ?");
		values.push(url);
	}
	if (weight !== undefined) {
		fields.push("weight = ?");
		values.push(weight);
	}
	if (limit !== undefined) {
		if (limit !== null && limit < 0) return res.status(400).json({ error: "Limit darf nicht negativ sein" });
		fields.push(`"limit" = ?`);
		values.push(limit);
	}
	if (calls !== undefined) {
		if (calls < 0) return res.status(400).json({ error: "Calls darf nicht negativ sein" });
		fields.push("calls = ?");
		values.push(calls);
	}
	if (placementId !== undefined) {
		fields.push("placementId = ?");
		values.push(placementId);
	}
	if (budget !== undefined) {
		if (budget !== null && budget < 0) return res.status(400).json({ error: "Budget darf nicht negativ sein" });
		fields.push("budget = ?");
		values.push(budget);
		fields.push("initialBudget = COALESCE(initialBudget, ?)");
		values.push(budget);
	}
	if (rateLimitPerMinute !== undefined) {
		if (rateLimitPerMinute !== null && rateLimitPerMinute < 0) {
			return res.status(400).json({ error: "rateLimitPerMinute darf nicht negativ sein" });
		}
		fields.push("rateLimitPerMinute = ?");
		values.push(rateLimitPerMinute);
	}

	if (fields.length === 0) {
		return res.status(400).json({ error: "Keine gültigen Felder übergeben" });
	}

	const sql = `UPDATE ads SET ${fields.join(", ")} WHERE id = ?`;
	values.push(id);

	try {
		const stmt = db.prepare(sql);
		const result = stmt.run(...values);

		if (result.changes === 0) return res.status(404).json({ error: "Ad nicht gefunden" });

		res.json({ id, updatedFields: fields.map((f) => f.split(" = ")[0]) });
	} catch (err) {
		console.error("❌ Fehler beim Bearbeiten:", err);
		res.status(500).send("Fehler beim Bearbeiten der Ad");
	}
});

// DELETE /api/v1/ads/:id
router.delete("/:id", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare("DELETE FROM ads WHERE id = ?");
		const result = stmt.run(id);

		if (result.changes === 0) return res.status(404).json({ error: "Ad nicht gefunden" });

		res.status(204).send();
	} catch (err) {
		console.error("❌ Fehler beim Löschen:", err);
		res.status(500).send("Fehler beim Löschen der Ad");
	}
});

export default router;
