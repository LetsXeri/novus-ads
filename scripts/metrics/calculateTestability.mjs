// scripts/metrics/calculateTestability.mjs

import { calculateAssertDensityInternal } from "./testability/calculateAssertDensityInternal.mjs";
import { calculateTestLOCInternal } from "./testability/calculateTestLOCInternal.mjs";
import { calculateTestToCodeRatioInternal } from "./testability/calculateTestToCodeRatioInternal.mjs";
import { calculateCoverageInternal } from "./testability/calculateCoverageInternal.mjs";

function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val));
}

/**
 * Bewertet die Testbarkeit anhand:
 * - Assert-Dichte (Ziel: > 1 pro Testfunktion)
 * - Testzeilenanteil (Ziel: > 20 %)
 * - Test/Code-Ratio (Ziel: > 0.5)
 * - Test Coverage Ratio (Ziel: > 80 %)
 */
export async function calculateTestability(sourcePath) {
	console.log("📊 Analyse der Testbarkeit:");
	console.log("──────────────────────────────────────────────");

	const [assertResult = {}, testLocResult = {}, testToCodeResult = {}, testCoverageResult = {}] = await Promise.all([
		calculateAssertDensityInternal(sourcePath),
		calculateTestLOCInternal(sourcePath),
		calculateTestToCodeRatioInternal(sourcePath),
		calculateCoverageInternal(sourcePath),
	]);

	const assertsPerTestFn = assertResult.assertsPerTestFn ?? 0;
	const testLocRatio = testLocResult.testLocRatio ?? 0;
	const testToCodeRatio = testToCodeResult.ratio ?? 0;
	const coverageRatio = testCoverageResult.coverageRatio ?? 0;

	// Scores (linear steigend von Schwelle bis Ziel)
	const scoreAssert = clamp((assertsPerTestFn - 0.5) * 10, 0, 10); // Ziel: > 1
	const scoreTestLOC = clamp((testLocRatio - 0.1) * 100, 0, 10); // Ziel: > 0.2
	const scoreTestToCode = clamp((testToCodeRatio - 0.25) * 40, 0, 10); // Ziel: > 0.5
	const scoreCoverage = clamp((coverageRatio - 0.5) * 25, 0, 10); // Ziel: > 0.8

	const score = 0.3 * scoreAssert + 0.25 * scoreTestLOC + 0.25 * scoreTestToCode + 0.2 * scoreCoverage;

	console.log("📉 Scores:");
	console.log(`🧪 Assert-Dichte: ${assertsPerTestFn.toFixed(2)} → Score: ${scoreAssert.toFixed(1)}`);
	console.log(`📄 Testzeilenanteil: ${(testLocRatio * 100).toFixed(1)} % → Score: ${scoreTestLOC.toFixed(1)}`);
	console.log(`📊 Test/Code-Ratio: ${testToCodeRatio.toFixed(2)} → Score: ${scoreTestToCode.toFixed(1)}`);
	console.log(`📈 Coverage-Ratio: ${(coverageRatio * 100).toFixed(1)} % → Score: ${scoreCoverage.toFixed(1)}`);
	console.log(`🧮 Testbarkeits-Score (0–10): ${score.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return score;
}
