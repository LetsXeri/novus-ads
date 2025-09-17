/**
 * Integrationstests für Ads-CRUD (src/ads.ts)
 * - arbeitet gegen frische, dateibasierte Test-DB
 * - prüft Validierungen und Happy Paths
 */
import fs from "fs";
import path from "path";
import express from "express";
import request from "supertest";

function createAppWithFreshDb(dbFileName: string): {
	app: express.Express;
	dbPath: string;
} {
	const dir = path.join(__dirname, "dbdata");
	const dbPath = path.join(dir, dbFileName);
	fs.mkdirSync(dir, { recursive: true });
	try {
		fs.unlinkSync(dbPath);
	} catch {}

	process.env.DATABASE_URL = dbPath;

	// Module frisch laden (lesen DATABASE_URL beim Import)
	const loaded = (() => {
		jest.resetModules();
		const dbMod = require("../db") as typeof import("../db");
		const adsRouter = require("../ads").default as import("express").Router;
		// Optional: placements anlegen für FK-ähnliche Nutzung
		dbMod.db
			.prepare(
				`
      INSERT INTO placements (name, status, createdAt, totalEarnings)
      VALUES ('P1', 'Aktiv', datetime('now'), 0)
    `
			)
			.run();
		return { adsRouter };
	})();

	const app = express();
	app.use(express.json());
	app.use("/api/v1/ads", loaded.adsRouter);
	return { app, dbPath };
}

describe("Ads CRUD /api/v1/ads", () => {
	let app: express.Express;
	let dbPath: string;

	afterEach(() => {
		jest.restoreAllMocks();
		try {
			if (dbPath) fs.unlinkSync(dbPath);
		} catch {}
	});

	test("POST validiert Pflichtfelder und negative Werte", async () => {
		({ app, dbPath } = createAppWithFreshDb("ads_crud_1.sqlite"));

		// Fehlende url/weight
		const r1 = await request(app).post("/api/v1/ads").send({ weight: 10 });
		expect(r1.status).toBe(400);

		// Negative budget
		const r2 = await request(app).post("/api/v1/ads").send({ url: "https://ad.example/a", weight: 100, budget: -1 });
		expect(r2.status).toBe(400);
		expect(r2.body?.error).toMatch(/Budget/);

		// Negative limit
		const r3 = await request(app).post("/api/v1/ads").send({ url: "https://ad.example/a", weight: 100, limit: -5 });
		expect(r3.status).toBe(400);
		expect(r3.body?.error).toMatch(/Limit/);

		// Negative rateLimitPerMinute
		const r4 = await request(app)
			.post("/api/v1/ads")
			.send({ url: "https://ad.example/a", weight: 100, rateLimitPerMinute: -2 });
		expect(r4.status).toBe(400);
		expect(r4.body?.error).toMatch(/rateLimitPerMinute/);
	});

	test("POST/GET/PUT/DELETE – Happy Path inkl. Validierungen im PUT", async () => {
		({ app, dbPath } = createAppWithFreshDb("ads_crud_2.sqlite"));

		// POST ok
		const createRes = await request(app).post("/api/v1/ads").send({
			url: "https://ad.example/a",
			weight: 100,
			budget: 50,
			limit: 10,
			placementId: 1,
			rateLimitPerMinute: 25,
		});
		expect(createRes.status).toBe(201);
		const id = Number(createRes.body.id);
		expect(id).toBeGreaterThan(0);

		// GET list enthält Ad
		const listRes = await request(app).get("/api/v1/ads");
		expect(listRes.status).toBe(200);
		expect(Array.isArray(listRes.body)).toBe(true);
		expect(listRes.body.find((a: any) => a.id === id)).toBeTruthy();

		// PUT invalid (negatives budget) → 400
		const badPut = await request(app).put(`/api/v1/ads/${id}`).send({ budget: -5 });
		expect(badPut.status).toBe(400);
		expect(badPut.body?.error).toMatch(/Budget/);

		// PUT valid – Update weight + rateLimitPerMinute
		const goodPut = await request(app).put(`/api/v1/ads/${id}`).send({ weight: 200, rateLimitPerMinute: 10 });
		expect(goodPut.status).toBe(200);
		expect(goodPut.body?.updatedFields).toEqual(expect.arrayContaining(["weight", "rateLimitPerMinute"]));

		// DELETE ok
		const delRes = await request(app).delete(`/api/v1/ads/${id}`);
		expect(delRes.status).toBe(204);

		// DELETE derselbe – 404
		const delRes2 = await request(app).delete(`/api/v1/ads/${id}`);
		expect(delRes2.status).toBe(404);
	});
});
