type NodeEnv = "development" | "staging" | "production" | string;

function requireEnv(name: string, fallback?: string): string {
	const v = process.env[name] ?? fallback;
	if (v === undefined || v === null || v === "") {
		throw new Error(`[config] Missing required env var: ${name}`);
	}
	return v;
}
function optionalNumber(name: string, fallback?: number): number | undefined {
	const v = process.env[name];
	if (v === undefined) return fallback;
	const n = Number(v);
	if (!Number.isFinite(n)) throw new Error(`[config] ${name} must be a number`);
	return n;
}

const NODE_ENV = (process.env.NODE_ENV as NodeEnv) ?? "development";
const PORT = optionalNumber("PORT", 4000) ?? 4000;

// API Versionierung
const API_PREFIX = process.env.API_PREFIX || "/api";
const API_VERSION = process.env.API_VERSION || "v1";

// Deprecation für unversionierte Pfade: Sunset-Datum (ISO)
const API_UNVERSIONED_SUNSET = process.env.API_UNVERSIONED_SUNSET || "2025-12-31T23:59:59Z";

// DB-URL (SQLite-Pfad)
const DATABASE_URL = process.env.DB_URL || process.env.DATABASE_URL || "./data.sqlite";

// CORS
const CORS_ORIGIN = requireEnv("CORS_ORIGIN", "http://localhost:5173");

// Feature-Flags
const ENABLE_LEGACY_ALIASES = process.env.ENABLE_LEGACY_ALIASES === "1";
const ENABLE_UNVERSIONED_ROUTES = process.env.ENABLE_UNVERSIONED_ROUTES !== "0"; // default: an

export const config = {
	env: NODE_ENV,
	port: PORT,
	databaseUrl: DATABASE_URL,
	corsOrigin: CORS_ORIGIN,
	enableLegacyAliases: ENABLE_LEGACY_ALIASES,
	api: {
		prefix: API_PREFIX,
		version: API_VERSION,
		unversionedSunset: API_UNVERSIONED_SUNSET,
		enableUnversioned: ENABLE_UNVERSIONED_ROUTES,
	},
};
