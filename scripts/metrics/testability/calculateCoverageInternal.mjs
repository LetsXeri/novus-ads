// scripts/metrics/testability/calculateCoverageInternal.mjs
import fs from "fs/promises";
import path from "path";

/**
 * Liest die coverage-summary.json aus und berechnet Branch- & Line Coverage
 */
export async function calculateCoverageInternal(sourcePath) {
	const coveragePath = path.resolve(sourcePath, "coverage/coverage-summary.json");
	try {
		const content = await fs.readFile(coveragePath, "utf-8");
		const json = JSON.parse(content);
		const total = json.total;

		const lineCoverage = total.lines.pct || 0;
		const branchCoverage = total.branches.pct || 0;

		console.log("\n📊 Code Coverage:");
		console.log(`📈 Line Coverage: ${lineCoverage.toFixed(2)} %`);
		console.log(`🌿 Branch Coverage: ${branchCoverage.toFixed(2)} %`);
		console.log("──────────────────────────────────────────────");

		return { lineCoverage, branchCoverage };
	} catch (e) {
		console.warn("⚠️ Keine coverage-summary.json gefunden in:", coveragePath);
		return { lineCoverage: 0, branchCoverage: 0 };
	}
}
