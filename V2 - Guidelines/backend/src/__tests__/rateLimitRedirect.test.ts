/**
 * Integrationstests: Rate Limiting pro Ad im Redirect-Flow.
 * - nutzt echte Express-Route (placements.ts)
 * - isolierte Test-DB pro Suite (Datei je Test)
 * - deterministisch via Mock von Date.now / Math.random
 */

import fs from "fs";
import path from "path";
import express from "express";
import request from "supertest";

function createAppWithFreshDb(dbFileName: string): {
	app: express.Express;
	db: import("better-sqlite3").Database;
	dbPath: string;
} {
	const dbPath = path.join(__dirname, dbFileName);

	// evtl. alte Reste löschen
	try {
		fs.unlinkSync(dbPath);
	} catch {}

	// 1) ENV für diese Instanz setzen
	process.env.DATABASE_URL = dbPath;

	// 2) Module-Cache leeren und frisch laden (ohne isolateModules-Rückgabe-Tricks)
	const loaded = (() => {
		jest.resetModules(); // leert den require-Cache für nächste requires
		// jetzt frisch laden – db.ts liest DATABASE_URL beim Import
		const dbMod = require("../db") as typeof import("../db");
		const placementsRouter = require("../placements").default as import("express").Router;
		return { dbMod, placementsRouter };
	})();

	// 3) Express-App aufsetzen
	const app = express();
	app.use(express.json());
	app.use("/api/v1/placements", loaded.placementsRouter);

	return {
		app,
		db: (loaded.dbMod as any).db as import("better-sqlite3").Database,
		dbPath,
	};
}

// Seed-Helper
function insertPlacement(db: import("better-sqlite3").Database, name = "P1", status = "Aktiv"): number {
	const stmt = db.prepare(
		`INSERT INTO placements (name, status, createdAt, totalEarnings)
     VALUES (?, ?, datetime('now'), 0)`
	);
	const res = stmt.run(name, status);
	return Number(res.lastInsertRowid);
}

type AdSeed = {
	url: string;
	weight?: number;
	limit?: number | null;
	budget?: number | null;
	placementId: number | null;
	rateLimitPerMinute?: number | null;
};

function insertAd(db: import("better-sqlite3").Database, a: AdSeed): number {
	const stmt = db.prepare(`
    INSERT INTO ads (url, weight, "limit", calls, budget, initialBudget, placementId, createdAt, rateLimitPerMinute)
    VALUES (?, ?, ?, 0, ?, ?, ?, datetime('now'), ?)
  `);
	const weight = a.weight ?? 100;
	const limit = a.limit ?? null;
	const budget = a.budget ?? null;
	const rate = a.rateLimitPerMinute ?? null;
	const res = stmt.run(a.url, weight, limit, budget, budget, a.placementId, rate);
	return Number(res.lastInsertRowid);
}

describe("Rate Limiting pro Ad – Redirect", () => {
	let app: express.Express;
	let db: import("better-sqlite3").Database;
	let dbPath: string;

	afterEach(() => {
		// Mocks zurücksetzen und DB-Datei dieses Tests entfernen
		jest.restoreAllMocks();
		try {
			if (dbPath) fs.unlinkSync(dbPath);
		} catch {}
	});

	test("Single Ad mit rateLimitPerMinute=2: zwei Redirects ok, dritter 404 (gleiches Zeitfenster)", async () => {
		({ app, db, dbPath } = createAppWithFreshDb("rl_test1.sqlite"));

		// Fixe Zeit (Minute)
		const baseMs = Date.UTC(2025, 0, 1, 12, 0, 0); // 2025-01-01 12:00:00 UTC
		jest.spyOn(Date, "now").mockReturnValue(baseMs);

		const placementId = insertPlacement(db);
		const urlA = "https://ad.example/a";
		insertAd(db, {
			url: urlA,
			weight: 100,
			placementId,
			rateLimitPerMinute: 2,
		});

		// 1. Request → 302 auf A
		const r1 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r1.status).toBe(302);
		expect(r1.headers.location).toBe(urlA);

		// 2. Request → 302 auf A (noch unter Limit)
		const r2 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r2.status).toBe(302);
		expect(r2.headers.location).toBe(urlA);

		// 3. Request innerhalb derselben Minute → 404 (Limit erreicht, keine Alternative)
		const r3 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r3.status).toBe(404);
		expect(r3.text).toMatch(/Kein Target verfügbar/);

		// Zeit ins nächste Zeitfenster verschieben (+60s)
		jest.spyOn(Date, "now").mockReturnValue(baseMs + 60_000);

		// 4. Request neue Minute → wieder 302
		const r4 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r4.status).toBe(302);
		expect(r4.headers.location).toBe(urlA);
	});

	test("Zwei Ads: A limitiert (1/min), B unlimitiert → nach 1. Aufruf A wird B gewählt", async () => {
		({ app, db, dbPath } = createAppWithFreshDb("rl_test2.sqlite"));

		const baseMs = Date.UTC(2025, 0, 1, 12, 0, 0);
		jest.spyOn(Date, "now").mockReturnValue(baseMs);

		const placementId = insertPlacement(db);

		const urlA = "https://ad.example/a";
		const urlB = "https://ad.example/b";

		// A zuerst, starkes Gewicht → wird bei gleicher Minute zuerst gewählt
		insertAd(db, { url: urlA, weight: 1000, placementId, rateLimitPerMinute: 1 });
		insertAd(db, { url: urlB, weight: 1, placementId, rateLimitPerMinute: null });

		// Deterministische Auswahl: immer Index 0 anvisieren
		const randomSpy = jest.spyOn(global.Math, "random").mockReturnValue(0);

		// 1. Request → A (unter Limit)
		const r1 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r1.status).toBe(302);
		expect(r1.headers.location).toBe(urlA);

		// 2. Request in derselben Minute → Kandidatenliste schließt A (1/min) aus, also B
		const r2 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r2.status).toBe(302);
		expect(r2.headers.location).toBe(urlB);

		randomSpy.mockRestore();
	});

	test("Rate-Limit greift, auch wenn Budget/Limit-Kriterien sonst erfüllt sind", async () => {
		({ app, db, dbPath } = createAppWithFreshDb("rl_test3.sqlite"));

		const baseMs = Date.UTC(2025, 0, 1, 12, 0, 0);
		jest.spyOn(Date, "now").mockReturnValue(baseMs);

		const placementId = insertPlacement(db);
		const urlA = "https://ad.example/a";

		// limit = groß, budget = null → keine andere Sperre; rateLimitPerMinute = 1 limitiert trotzdem
		insertAd(db, {
			url: urlA,
			weight: 100,
			placementId,
			limit: 9999,
			budget: null,
			rateLimitPerMinute: 1,
		});

		// 1. ok
		const r1 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r1.status).toBe(302);
		expect(r1.headers.location).toBe(urlA);

		// 2. in gleicher Minute → 404 (kein Alternativ-Target)
		const r2 = await request(app).get(`/api/v1/placements/${placementId}/redirect`).redirects(0);
		expect(r2.status).toBe(404);
		expect(r2.text).toMatch(/Kein Target verfügbar/);
	});
});
