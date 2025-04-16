import { Router } from "express";
import { db } from "./db";
import { TargetType } from "./types/target";

const router = Router();

// GET /campaigns
router.get("/", (req, res) => {
	try {
		const stmt = db.prepare("SELECT * FROM campaigns ORDER BY createdAt DESC");
		const campaigns = stmt.all();
		res.json(campaigns);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Fehler beim Abrufen");
	}
});

// POST /campaigns
router.post("/", (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "Name fehlt" });

	try {
		const stmt = db.prepare("INSERT INTO campaigns (name, createdAt) VALUES (?, datetime('now'))");
		const result = stmt.run(name);
		res.status(201).json({ id: result.lastInsertRowid, name });
	} catch (err) {
		console.error("❌ Fehler beim Erstellen:", err);
		res.status(500).send("Fehler beim Erstellen");
	}
});

// PUT /campaigns/:id
router.put("/:id", (req, res) => {
	const { id } = req.params;
	const { name } = req.body;

	if (!name) return res.status(400).json({ error: "Name fehlt" });

	try {
		const stmt = db.prepare("UPDATE campaigns SET name = ? WHERE id = ?");
		const result = stmt.run(name, id);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Kampagne nicht gefunden" });
		}

		res.json({ id, name });
	} catch (err) {
		console.error("❌ Fehler beim Aktualisieren:", err);
		res.status(500).send("Fehler beim Aktualisieren");
	}
});

// DELETE /campaigns/:id
router.delete("/:id", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare("DELETE FROM campaigns WHERE id = ?");
		const result = stmt.run(id);

		if (result.changes === 0) {
			return res.status(404).json({ error: "Kampagne nicht gefunden" });
		}

		res.status(204).send(); // No Content
	} catch (err) {
		console.error("❌ Fehler beim Löschen:", err);
		res.status(500).send("Fehler beim Löschen");
	}
});

router.get("/:id/earnings", (req, res) => {
	const { id } = req.params;

	try {
		const stmt = db.prepare(`
			SELECT year, month, amount
			FROM campaign_earnings
			WHERE campaignId = ?
			ORDER BY year DESC, month DESC
		`);
		const earnings = stmt.all(id);
		res.json(earnings);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen der Einnahmen:", err);
		res.status(500).send("Fehler beim Abrufen");
	}
});

router.get("/:id/redirect", (req, res) => {
	const { id } = req.params;

	try {
		// Gültige Targets abrufen (Limit + Budget prüfen)
		const stmt = db.prepare(`
			SELECT * FROM targets
			WHERE campaignId = ?
			  AND ("limit" IS NULL OR calls < "limit")
			  AND (budget IS NULL OR budget > 0)
		`);
		const targets = stmt.all(id) as TargetType[];

		if (targets.length === 0) {
			return res.status(404).send("Keine verfügbaren Ziel-URLs gefunden");
		}

		// Gewichtete Zufallsauswahl
		const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
		const rand = Math.random() * totalWeight;

		let cumulative = 0;
		let selectedTarget: TargetType | null = null;

		for (const target of targets) {
			cumulative += target.weight;
			if (rand <= cumulative) {
				selectedTarget = target;
				break;
			}
		}

		if (!selectedTarget) {
			return res.status(500).send("Fehler bei der Auswahl der Ziel-URL");
		}

		const { id: targetId, limit, budget, campaignId } = selectedTarget;
		const costPerCall = limit && budget ? budget / limit : 0;

		// Datenbank-Updates
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;

		// 1. Target aktualisieren: +1 Call, -Budget
		const updateTarget = db.prepare(`
			UPDATE targets
			SET calls = calls + 1,
				budget = CASE
					WHEN budget IS NOT NULL AND limit IS NOT NULL THEN MAX(0, budget - ?)
					ELSE budget
				END
			WHERE id = ?
		`);
		updateTarget.run(costPerCall, targetId);

		// 2. Kampagnen-Einnahmen: Gesamt + Monat
		if (campaignId !== null) {
			// Gesamtverdienst erhöhen
			const updateTotalEarnings = db.prepare(`
				UPDATE campaigns
				SET totalEarnings = totalEarnings + ?
				WHERE id = ?
			`);
			updateTotalEarnings.run(costPerCall, campaignId);

			// Monatsverdienst eintragen oder aktualisieren
			const updateMonthlyEarnings = db.prepare(`
				INSERT INTO campaign_earnings (campaignId, year, month, amount)
				VALUES (?, ?, ?, ?)
				ON CONFLICT(campaignId, year, month)
				DO UPDATE SET amount = amount + excluded.amount
			`);
			updateMonthlyEarnings.run(campaignId, year, month, costPerCall);
		}

		// Redirect ausführen
		return res.redirect(302, selectedTarget.url);
	} catch (err) {
		console.error("❌ Fehler beim Redirect:", err);
		res.status(500).send("Fehler beim Redirect");
	}
});

export default router;
