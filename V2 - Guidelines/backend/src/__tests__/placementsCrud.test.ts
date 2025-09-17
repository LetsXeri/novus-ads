/**
 * Integrationstests für Placements-CRUD (src/placements.ts)
 * - frische, dateibasierte Test-DB je Suite
 * - prüft Validierungen und Happy Paths
 * - deckt Earnings-Endpoint mit ab (Basis: leeres Ergebnis)
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
		const placementsRouter = require("../placements").default as import("express").Router;
		return { placementsRouter };
	})();

	const app = express();
	app.use(express.json());
	app.use("/api/v1/placements", loaded.placementsRouter);
	return { app, dbPath };
}

describe("Placements CRUD /api/v1/placements", () => {
	let app: express.Express;
	let dbPath: string;

	afterEach(() => {
		jest.restoreAllMocks();
		try {
			if (dbPath) fs.unlinkSync(dbPath);
		} catch {}
	});

	test("POST validiert Pflichtfelder", async () => {
		({ app, dbPath } = createAppWithFreshDb("placements_crud_1.sqlite"));

		// Fehlender name → 400
		const r1 = await request(app).post("/api/v1/placements").send({ status: "Aktiv" });
		expect(r1.status).toBe(400);
		expect(r1.body?.error || r1.text).toMatch(/Name/i);
	});

	test("POST/GET/PUT/DELETE – Happy Path + Validierungsfehler im PUT", async () => {
		({ app, dbPath } = createAppWithFreshDb("placements_crud_2.sqlite"));

		// POST ok
		const createRes = await request(app).post("/api/v1/placements").send({
			name: "Homepage Sidebar",
			status: "Aktiv",
		});
		expect(createRes.status).toBe(201);
		const id = Number(createRes.body.id);
		expect(id).toBeGreaterThan(0);

		// GET list enthält Placement
		const listRes = await request(app).get("/api/v1/placements");
		expect(listRes.status).toBe(200);
		expect(Array.isArray(listRes.body)).toBe(true);
		expect(listRes.body.find((p: any) => p.id === id)?.name).toBe("Homepage Sidebar");

		// Earnings-Endpoint existiert und liefert Array (initial leer)
		const earnRes = await request(app).get(`/api/v1/placements/${id}/earnings`);
		expect(earnRes.status).toBe(200);
		expect(Array.isArray(earnRes.body)).toBe(true);

		// PUT ohne Felder → 400 (gemäß Router-Logik)
		const badPut = await request(app).put(`/api/v1/placements/${id}`).send({});
		expect(badPut.status).toBe(400);

		// PUT mit Feldern → 200
		const goodPut = await request(app).put(`/api/v1/placements/${id}`).send({
			name: "Sidebar DE",
			status: "Pausiert",
		});
		expect(goodPut.status).toBe(200);
		expect(Array.isArray(goodPut.body?.updatedFields)).toBe(true);
		expect(goodPut.body.updatedFields).toEqual(expect.arrayContaining(["name", "status"]));

		// DELETE ok
		const delRes = await request(app).delete(`/api/v1/placements/${id}`);
		expect(delRes.status).toBe(204);

		// DELETE derselbe → 404
		const delRes2 = await request(app).delete(`/api/v1/placements/${id}`);
		expect(delRes2.status).toBe(404);
	});
});
