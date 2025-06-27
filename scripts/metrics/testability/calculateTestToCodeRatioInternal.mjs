// scripts/metrics/testability/calculateTestToCodeRatioInternal.mjs

import path from "path";
import glob from "fast-glob";

/**
 * Ermittelt das Verhältnis von Testdateien zu Produktivdateien (Test/Code Ratio)
 */
export async function calculateTestToCodeRatioInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);

	// Testdateien: *.test.ts(x), *.spec.ts(x), etc.
	const testPatterns = [`${absPath}/**/*.{test,spec}.{ts,tsx,js,jsx}`];
	const testFiles = await glob(testPatterns, { absolute: true });

	// Produktivcode: alle Dateien ohne .test/.spec im Namen
	const codePatterns = [`${absPath}/**/*.{ts,tsx,js,jsx}`];
	const allCodeFiles = await glob(codePatterns, { absolute: true });
	const codeFiles = allCodeFiles.filter((f) => !f.includes(".test.") && !f.includes(".spec."));

	const testCount = testFiles.length;
	const codeCount = codeFiles.length;
	const ratio = codeCount > 0 ? testCount / codeCount : 0;

	console.log(`\n📁 Test vs Code Dateien`);
	console.log(`🔬 Testdateien: ${testCount}`);
	console.log(`📦 Produktivdateien: ${codeCount}`);
	console.log(`📊 Test/Code-Ratio: ${ratio.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return {
		testCount,
		codeCount,
		ratio,
	};
}
