import { Router } from "express";
import { db } from "./db";
import { Ad } from "./types/ad";

const router = Router();

/**
 * Ads = vormals "Targets"
 * - Tabelle: ads (statt targets)
 * - Fremdschlüssel: placementId (statt campaignId)
 */

// GET /ads – alle Ads
router.get("/", (req, res) => {
	try {
		const stmt = db.prepare("SELECT * FROM ads");
		const ads = stmt.all() as Ad[];
		res.json(ads);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Fehler beim Abrufen der Ads");
	}
});

// POST /ads – neue Ad anlegen
router.post("/", (req, res) => {
	const { url, weight, limit, placementId, budget } = req.body;

	if (!url || typeof weight !== "number") {
		return res.status(400).json({ error: "url und weight sind Pflichtfelder" });
	}

	try {
		const stmt = db.prepare(`
      INSERT INTO ads (url, weight, "limit", calls, placementId, budget)
      VALUES (?, ?, ?, 0, ?, ?)
    `);
		const result = stmt.run(
			url,
			weight,
			typeof limit === "number" ? limit : null,
			typeof placementId === "number" ? placementId : placementId ?? null,
			typeof budget === "number" ? budget : budget ?? null
		);

		res.status(201).json({
			id: result.lastInsertRowid,
			url,
			weight,
			limit: typeof limit === "number" ? limit : null,
			calls: 0,
			placementId: typeof placementId === "number" ? placementId : placementId ?? null,
			budget: typeof budget === "number" ? budget : budget ?? null,
		} as Ad);
	} catch (err) {
		console.error("❌ Fehler beim Anlegen:", err);
		res.status(500).send("Fehler beim Anlegen der Ad");
	}
});

// PUT /ads/:id – Ad bearbeiten
router.put("/:id", (req, res) => {
	const { id } = req.params;
	const { url, weight, limit, calls, placementId, budget } = req.body;

	const fields: string[] = [];
	const values: any[] = [];

	if (typeof url === "string") {
		fields.push("url = ?");
		values.push(url);
	}
	if (typeof weight === "number") {
		fields.push("weight = ?");
		values.push(weight);
	}
	if (typeof limit === "number" || limit === null) {
		fields.push('"limit" = ?');
		values.push(limit);
	}
	if (typeof calls === "number") {
		fields.push("calls = ?");
		values.push(calls);
	}

	// placementId robust parsen (null | number | string-number)
	const parsedPlacementId =
		placementId === null
			? null
			: typeof placementId === "number"
			? placementId
			: !isNaN(Number(placementId))
			? Number(placementId)
			: undefined;

	if (parsedPlacementId !== undefined) {
		fields.push("placementId = ?");
		values.push(parsedPlacementId);
	}

	if (typeof budget === "number" || budget === null) {
		fields.push("budget = ?");
		values.push(budget);
	}

	if (fields.length === 0) {
		return res.status(400).json({ error: "Keine gültigen Felder übergeben" });
	}

	const sql = `UPDATE ads SET ${fields.join(", ")} WHERE id = ?`;
	values.push(id);

	try {
		const stmt = db.prepare(sql);
		const result = stmt.run(...values);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Ad nicht gefunden" });
		}

		res.json({ id, updatedFields: fields.map((f) => f.split(" = ")[0]) });
	} catch (err) {
		console.error("❌ Fehler beim Bearbeiten:", err);
		res.status(500).send("Fehler beim Bearbeiten der Ad");
	}
});

// DELETE /ads/:id – Ad löschen
router.delete("/:id", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare("DELETE FROM ads WHERE id = ?");
		const result = stmt.run(id);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Ad nicht gefunden" });
		}

		res.status(204).send();
	} catch (err) {
		console.error("❌ Fehler beim Löschen:", err);
		res.status(500).send("Fehler beim Löschen der Ad");
	}
});

export default router;
