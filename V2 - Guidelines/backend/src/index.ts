import express, { Router } from "express";
import cors from "cors";
import { config } from "./config";

import placementsRouter from "./placements";
import adsRouter from "./ads";

import { withApiVersion, markDeprecated } from "./middleware/versioning";

const app = express();
app.use(express.json());
app.use(
	cors({
		origin: config.corsOrigin,
	})
);

// ---- v1 Router zusammenbauen ----
const v1 = Router();
v1.use("/placements", placementsRouter);
v1.use("/ads", adsRouter);

// Health
v1.get("/healthz", (_req, res) => res.json({ ok: true, env: config.env, version: config.api.version }));

// ---- Mount /api/v1/... ----
const v1BasePath = `${config.api.prefix}/${config.api.version}`;
app.use(v1BasePath, withApiVersion(config.api.version), v1);

// ---- Backward-Compatibility: /api/* (unversioniert) → deprecate, aber weiterhin funktionsfähig ----
if (config.api.enableUnversioned) {
	app.use(
		config.api.prefix,
		markDeprecated(config.api.unversionedSunset),
		withApiVersion(config.api.version),
		v1 // gleiche Routen-Struktur unter /api/*
	);
}

app.listen(config.port, () => {
	console.log(`🚀 API läuft auf http://0.0.0.0:${config.port}`);
	console.log(`   Mounted v${config.api.version}: ${v1BasePath}`);
	if (config.api.enableUnversioned) {
		console.log(`   Legacy (deprecated): ${config.api.prefix}/*  (Sunset: ${config.api.unversionedSunset})`);
	}
});
