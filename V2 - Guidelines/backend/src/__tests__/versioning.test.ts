/**
 * Unit-/Middleware-Tests für src/middleware/versioning.ts
 */
import express from "express";
import request from "supertest";
import { withApiVersion, markDeprecated } from "../middleware/versioning";

describe("middleware/versioning", () => {
	test("withApiVersion setzt X-API-Version Header", async () => {
		const app = express();
		app.use(withApiVersion("v1.0.0-test"));
		app.get("/ping", (_req, res) => res.status(200).send("pong"));

		const r = await request(app).get("/ping");
		expect(r.status).toBe(200);
		expect(r.headers["x-api-version"]).toBe("v1.0.0-test");
	});

	test("markDeprecated setzt Deprecation, Sunset und Link (ersetzt /api → /api/v1)", async () => {
		const app = express();
		const sunset = "2030-01-01T00:00:00.000Z";
		app.use(markDeprecated(sunset));
		// unversionierte Route
		app.get("/api/old", (_req, res) => res.status(200).send("ok"));

		const r = await request(app).get("/api/old");
		expect(r.status).toBe(200);
		expect(r.headers["deprecation"]).toBe("true");
		expect(r.headers["sunset"]).toBe(sunset);
		// Link-Header sollte auf /api/v1/old zeigen (rel="alternate")
		expect(r.headers["link"]).toBe('</api/v1/old>; rel="alternate"');
	});

	test("markDeprecated verändert nicht bereits versionierte Pfade (/api/v1/...)", async () => {
		const app = express();
		const sunset = "2030-01-01T00:00:00.000Z";
		app.use(markDeprecated(sunset));
		app.get("/api/v1/new", (_req, res) => res.status(200).send("ok"));

		const r = await request(app).get("/api/v1/new");
		expect(r.status).toBe(200);
		expect(r.headers["deprecation"]).toBe("true");
		expect(r.headers["sunset"]).toBe(sunset);
		// Regex ersetzt /api NICHT, wenn bereits /api/v1 vorhanden ist
		expect(r.headers["link"]).toBe('</api/v1/new>; rel="alternate"');
	});
});
