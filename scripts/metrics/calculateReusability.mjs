import { calculateWMCInternal } from "./reusability/calculateWMC.mjs";
import { calculateRFCInternal } from "./reusability/calculateRFC.mjs";
import { calculateLCOM4Internal } from "./reusability/calculateLCOM4.mjs";

/**
 * Berechnet den Wiederverwendbarkeitsscore (0–10) basierend auf WMC, ØParam, RFC und LCOM4
 */
export async function calculateReusability(sourcePath) {
	const wmcResult = await calculateWMCInternal(sourcePath); // { avgFunctionsPerFile, avgParamsPerFunction }
	const rfcResult = await calculateRFCInternal(sourcePath); // { avgRFC }
	const lcomResult = await calculateLCOM4Internal(sourcePath); // { avgLCOM4 }

	// Normalisierung (linear abfallend, siehe Tabelle)
	const scoreWMC = clamp(10 - 2.5 * (wmcResult.avgFunctionsPerFile ?? 0), 0, 10); // Ziel: 1–5
	const scoreParam = clamp(10 - 5 * (wmcResult.avgParamsPerFunction ?? 0), 0, 10); // Ziel: 0–2
	const scoreRFC = clamp(((15 - (rfcResult.avgRFC ?? 0)) / 10) * 10, 0, 10);
	const scoreLCOM = clamp(10 - 5 * ((lcomResult.avgLCOM4 ?? 1) - 1), 0, 10); // Ziel: 1–3

	// Gewichtung
	const score = 0.3 * scoreWMC + 0.2 * scoreParam + 0.3 * scoreRFC + 0.2 * scoreLCOM;

	console.log(`\n♻️ Wiederverwendbarkeit`);
	console.log(
		`⚖️  WMC (Ø Funktionen pro Datei): ${wmcResult.avgFunctionsPerFile.toFixed(2)} → Score: ${scoreWMC.toFixed(1)}`
	);
	console.log(
		`🔢 Ø Parameter pro Funktion: ${wmcResult.avgParamsPerFunction.toFixed(2)} → Score: ${scoreParam.toFixed(1)}`
	);
	console.log(`📨 RFC (Response for a File): ${rfcResult.avgRFC.toFixed(2)} → Score: ${scoreRFC.toFixed(1)}`);
	console.log(`🧬 LCOM4 (Ø Teilgraphen): ${lcomResult.avgLCOM4.toFixed(2)} → Score: ${scoreLCOM.toFixed(1)}`);
	console.log(`🧮 Wiederverwendbarkeit-Score (0–10): ${score.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return score;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
