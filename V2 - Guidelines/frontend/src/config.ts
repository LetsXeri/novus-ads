// Vite liest Variablen mit Präfix VITE_ zur Buildzeit ein.
// Wir zentralisieren hier die API-URL und validieren minimal.

function requireViteEnv(name: string): string {
	const v = import.meta.env[name] as string | undefined;
	if (!v || v.trim() === "") {
		throw new Error(`[config] Missing ${name}. Define it in your .env.* files.`);
	}
	return v;
}

/**
 * Empfehlung für Container/Cloud:
 * - Production/Staging: VITE_API_URL = "/api"
 *   => NGINX leitet /api an das Backend weiter (siehe nginx.conf).
 * - Development: VITE_API_URL = "http://localhost:4000"
 */
export const API_URL = requireViteEnv("VITE_API_URL");
