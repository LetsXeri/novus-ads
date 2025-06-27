// scripts/metrics/calculateAnalyzability.mjs

import { calculateCCInternal } from "./analyzability/calculateCCInternal2.mjs";
import { calculateHalsteadInternal } from "./analyzability/calculateHalsteadInternal.mjs";
import { calculateLOCInternal } from "./analyzability/calculateLOCInternal.mjs";

function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val));
}

/**
 * Bewertet die Analysierbarkeit anhand von 3 Teilmetriken:
 * - Cyclomatic Complexity (Ziel: < 5)
 * - Halstead Effort (Ziel: < 2000)
 * - Lines of Code (Ziel: < 50 pro Datei)
 */
export async function calculateAnalyzability(sourcePath) {
	console.log("📊 Analyse der Analysierbarkeit:");
	console.log("──────────────────────────────────────────────");

	const [ccResult, halsteadResult, locResult] = await Promise.all([
		calculateCCInternal(sourcePath),
		calculateHalsteadInternal(sourcePath),
		calculateLOCInternal(sourcePath),
	]);

	// Teil-Scores (jeweils 0–10)
	const scoreCC = clamp(10 - (5 * Math.max(0, ccResult.avgCC - 2)) / 4, 0, 10); // ideal bei ≤ 2, fällt bei >6
	const scoreEffort = clamp(10 - (10 * Math.max(0, halsteadResult.avgEffort - 500)) / 3500, 0, 10); // ideal < 500, 0 bei ≥ 4000
	const scoreLOC = clamp(10 - (10 * Math.max(0, locResult.avgLOC - 40)) / 60, 0, 10); // ideal < 40, 0 bei ≥ 100

	// Gewichtung: CC = 40 %, Halstead = 30 %, LOC = 30 %
	const score = 0.4 * scoreCC + 0.3 * scoreEffort + 0.3 * scoreLOC;

	// Ausgabe
	console.log("📉 Scores:");
	console.log(`🧠 Cyclomatic Complexity: ${ccResult.avgCC.toFixed(2)} → Score: ${scoreCC.toFixed(1)}`);
	console.log(`📈 Halstead Effort: ${halsteadResult.avgEffort.toFixed(2)} → Score: ${scoreEffort.toFixed(1)}`);
	console.log(`📏 Avg. LOC per File: ${locResult.avgLOC.toFixed(2)} → Score: ${scoreLOC.toFixed(1)}`);
	console.log(`🧮 Analysierbarkeits-Score (0–10): ${score.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return score;
}
