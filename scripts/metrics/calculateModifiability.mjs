// scripts/metrics/calculateModifiability.mjs

import { calculateChurnInternal } from "./modifiability/calculateChurnInternal.mjs";
import { calculateAuthorsInternal } from "./modifiability/calculateAuthorsInternal.mjs";
import { calculateSDIInternal } from "./modifiability/calculateSDIInternal.mjs";

function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val));
}

/**
 * Bewertet die Modifizierbarkeit anhand:
 * - Code Churn (Ziel: < 50 Zeilen pro Datei)
 * - Anzahl Autoren (Ziel: < 3 pro Datei)
 * - Software Design Instability (SDI-2) (Ziel: < 0.4)
 */
export async function calculateModifiability(sourcePath) {
	console.log("📊 Analyse der Modifizierbarkeit:");
	console.log("──────────────────────────────────────────────");

	const [churnResult, authorsResult, sdiResult] = await Promise.all([
		calculateChurnInternal(sourcePath),
		calculateAuthorsInternal(sourcePath),
		calculateSDIInternal(sourcePath),
	]);

	// Teil-Scores (jeweils 0–10)
	const scoreChurn = clamp(10 - (churnResult.avgChurn - 30) * 0.125, 0, 10); // 30 ideal, 110 = 0
	const scoreAuthors = clamp(10 - (authorsResult.avgAuthors - 3) * 3.33, 0, 10); // 3 ideal, 6 = 0
	const scoreSDI = clamp(10 - (sdiResult.avgSDI - 0.2) * 33.3, 0, 10); // ideal 0.2, 0 bei 0.5

	// Gewichtung: Churn = 40 %, Authors = 30 %, SDI-2 = 30 %
	const score = 0.4 * scoreChurn + 0.3 * scoreAuthors + 0.3 * scoreSDI;

	console.log("📉 Scores:");
	console.log(`🌀 Code Churn: ${churnResult.avgChurn.toFixed(2)} → Score: ${scoreChurn.toFixed(1)}`);
	console.log(`👤 Ø Autoren: ${authorsResult.avgAuthors.toFixed(2)} → Score: ${scoreAuthors.toFixed(1)}`);
	console.log(`📦 SDI-2: ${sdiResult.avgSDI.toFixed(2)} → Score: ${scoreSDI.toFixed(1)}`);
	console.log(`🧮 Modifizierbarkeits-Score (0–10): ${score.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return score;
}
