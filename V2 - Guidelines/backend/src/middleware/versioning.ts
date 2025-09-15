import { RequestHandler } from "express";

/** Hängt API-Version-Header an jede Antwort */
export const withApiVersion =
	(version: string): RequestHandler =>
	(req, res, next) => {
		res.setHeader("X-API-Version", version);
		next();
	};

/**
 * Markiert unversionierte Routen als deprecated und verweist auf /api/v1
 * Best Practices:
 * - Deprecation: true
 * - Sunset: fixes Datum, ab dem der Pfad entfernt wird
 * - Link: <neue-url>; rel="alternate"
 */
export const markDeprecated =
	(sunsetISODate: string): RequestHandler =>
	(req, res, next) => {
		res.setHeader("Deprecation", "true");
		res.setHeader("Sunset", sunsetISODate);
		// Hinweis-Link zum v1-Pendant
		const newUrl = req.originalUrl.replace(/^(?:\/api)(?!\/v1)/, "/api/v1");
		res.setHeader("Link", `<${newUrl}>; rel="alternate"`);
		next();
	};
