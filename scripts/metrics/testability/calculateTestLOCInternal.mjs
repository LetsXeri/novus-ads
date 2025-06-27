// scripts/metrics/testability/calculateTestLOCInternal.mjs

import path from "path";
import fs from "fs/promises";
import glob from "fast-glob";

/**
 * Analysiert die durchschnittliche Länge von Testdateien
 * (Test-LOC = Lines of Code pro Testdatei)
 */
export async function calculateTestLOCInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const patterns = [`${absPath}/**/*.{test,spec}.{ts,tsx,js,jsx}`];
	const files = await glob(patterns, { absolute: true });

	let totalLOC = 0;

	for (const file of files) {
		const content = await fs.readFile(file, "utf-8");
		const lines = content.split("\n").filter((line) => line.trim() !== "");
		totalLOC += lines.length;
	}

	const avgLOC = files.length > 0 ? totalLOC / files.length : 0;

	console.log(`\n📁 Testdateien analysiert: ${files.length}`);
	console.log(`📏 Durchschnittliche Zeilen pro Testdatei: ${avgLOC.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return {
		fileCount: files.length,
		avgLOC,
	};
}
