// scripts/metrics/analyzability/calculateCCInternal.mjs
import fs from "fs";
import path from "path";
import escomplex from "typhonjs-escomplex";
const { createModuleReport } = escomplex;

/**
 * Berechnet die durchschnittliche Cyclomatic Complexity über alle Funktionen.
 */
export async function calculateCCInternal(sourcePath) {
	const files = await collectSourceFiles(sourcePath);
	let totalCC = 0;
	let functionCount = 0;
	let maxCC = 0;
	let maxFile = "";

	for (const filePath of files) {
		const code = fs.readFileSync(filePath, "utf8");

		try {
			const report = createModuleReport(code);
			const functions = report.functions || [];

			if (functions.length === 0) continue;

			const ccSum = functions.reduce((acc, fn) => acc + fn.cyclomatic, 0);
			const avgCC = ccSum / functions.length;

			totalCC += ccSum;
			functionCount += functions.length;

			const maxFn = functions.reduce((prev, curr) => (curr.cyclomatic > prev.cyclomatic ? curr : prev));
			if (maxFn.cyclomatic > maxCC) {
				maxCC = maxFn.cyclomatic;
				maxFile = path.basename(filePath);
			}
		} catch (e) {
			// Parsing errors ignorieren
		}
	}

	const avgCC = functionCount > 0 ? totalCC / functionCount : 0;

	console.log(`\n📊 Zusammenfassung Cyclomatic Complexity:`);
	console.log(`📄 Dateien analysiert: ${files.length}`);
	console.log(`🧮 Durchschnittliche CC: ${avgCC.toFixed(2)}`);
	console.log(`📌 Höchste CC: ${maxCC} in '${maxFile}'`);
	console.log("──────────────────────────────────────────────");

	return { avgCC };
}

async function collectSourceFiles(dir) {
	const exts = [".ts", ".tsx", ".js", ".jsx"];
	const files = [];

	function walk(currentPath) {
		const entries = fs.readdirSync(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (exts.some((ext) => entry.name.endsWith(ext))) {
				files.push(fullPath);
			}
		}
	}

	walk(path.resolve(dir));
	return files;
}
