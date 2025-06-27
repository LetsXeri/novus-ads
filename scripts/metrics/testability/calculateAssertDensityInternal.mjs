// scripts/metrics/testability/calculateAssertDensityInternal.mjs

import path from "path";
import fs from "fs/promises";
import { globby } from "globby";

/** Zählt assert-Statements in Testdateien (z. B. expect, assert, etc.) */
export async function calculateAssertDensityInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const testFiles = await globby([`${absPath}/**/*.{test,spec}.{js,ts,jsx,tsx}`]);

	let totalAsserts = 0;
	let totalLines = 0;

	for (const file of testFiles) {
		const content = await fs.readFile(file, "utf8");
		const lines = content.split("\n").length;
		const assertMatches = content.match(/\b(expect|assert|should|chai)\b/g);
		const asserts = assertMatches ? assertMatches.length : 0;

		totalLines += lines;
		totalAsserts += asserts;
	}

	const assertDensity = totalLines > 0 ? totalAsserts / totalLines : 0;

	console.log(`\n📁 Projekt: ${absPath}`);
	console.log(`\n📊 Assert-Dichte:`);
	console.log(`🧪 Testdateien gefunden: ${testFiles.length}`);
	console.log(`🔢 Assertions gefunden: ${totalAsserts}`);
	console.log(`📏 Gesamte Testzeilen: ${totalLines}`);
	console.log(`📈 Assert-Dichte: ${assertDensity.toFixed(4)}\n`);

	return {
		assertDensity,
		testFiles: testFiles.length,
		totalAsserts,
		totalLines,
	};
}
