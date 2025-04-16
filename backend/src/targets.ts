import { Router } from "express";
import { db } from "./db";

const router = Router();

// GET /targets – alle Ziel-URLs
router.get("/", (req, res) => {
	try {
		const stmt = db.prepare("SELECT * FROM targets");
		const targets = stmt.all();
		res.json(targets);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Fehler beim Abrufen der Ziele");
	}
});

// POST /targets – neue Ziel-URL anlegen
router.post("/", (req, res) => {
	const { url, weight, limit, campaignId } = req.body;

	if (!url || typeof weight !== "number") {
		return res.status(400).json({ error: "url und weight sind Pflichtfelder" });
	}

	try {
		const stmt = db.prepare(`
        INSERT INTO targets (url, weight, "limit", calls, campaignId)
        VALUES (?, ?, ?, 0, ?)
      `);
		const result = stmt.run(url, weight, limit ?? null, campaignId ?? null);

		res.status(201).json({
			id: result.lastInsertRowid,
			url,
			weight,
			limit: limit ?? null,
			calls: 0,
			campaignId: campaignId ?? null,
		});
	} catch (err) {
		console.error("❌ Fehler beim Anlegen:", err);
		res.status(500).send("Fehler beim Anlegen der Ziel-URL");
	}
});

// PUT /targets/:id – Ziel-URL bearbeiten
router.put("/:id", (req, res) => {
	const { id } = req.params;
	const { url, weight, limit, calls, campaignId } = req.body;

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
	if (typeof campaignId === "number" || campaignId === null) {
		fields.push("campaignId = ?");
		values.push(campaignId);
	}

	if (fields.length === 0) {
		return res.status(400).json({ error: "Keine gültigen Felder übergeben" });
	}

	const sql = `UPDATE targets SET ${fields.join(", ")} WHERE id = ?`;
	values.push(id);

	try {
		const stmt = db.prepare(sql);
		const result = stmt.run(...values);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Ziel-URL nicht gefunden" });
		}

		res.json({ id, updatedFields: Object.keys(req.body) });
	} catch (err) {
		console.error("❌ Fehler beim Bearbeiten:", err);
		res.status(500).send("Fehler beim Bearbeiten der Ziel-URL");
	}
});

// DELETE /targets/:id – Ziel-URL löschen
router.delete("/:id", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare("DELETE FROM targets WHERE id = ?");
		const result = stmt.run(id);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Ziel-URL nicht gefunden" });
		}

		res.status(204).send();
	} catch (err) {
		console.error("❌ Fehler beim Löschen:", err);
		res.status(500).send("Fehler beim Löschen der Ziel-URL");
	}
});

export default router;
