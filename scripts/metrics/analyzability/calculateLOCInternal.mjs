// scripts/metrics/analyzability/calculateLOCInternal.mjs

import fs from "fs";
import path from "path";

/**
 * Rekursiv alle Code-Dateien sammeln
 */
function getAllCodeFiles(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = entries.flatMap((entry) => {
		const res = path.resolve(dir, entry.name);
		if (entry.isDirectory()) return getAllCodeFiles(res);
		if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) return res;
		return [];
	});
	return files;
}

/**
 * Berechnet LOC-Metriken (gesamt, leer, Kommentar)
 */
export async function calculateLOCInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const files = getAllCodeFiles(absPath);

	let totalLines = 0;
	let totalEmpty = 0;
	let totalComment = 0;
	let fileCount = 0;

	for (const file of files) {
		try {
			const content = fs.readFileSync(file, "utf8");
			const lines = content.split(/\r?\n/);
			let commentLines = 0;
			let inBlockComment = false;

			for (let line of lines) {
				line = line.trim();
				if (line === "") {
					totalEmpty++;
					continue;
				}
				if (inBlockComment) {
					commentLines++;
					if (line.endsWith("*/")) inBlockComment = false;
					continue;
				}
				if (line.startsWith("//")) {
					commentLines++;
				} else if (line.startsWith("/*")) {
					commentLines++;
					if (!line.endsWith("*/")) inBlockComment = true;
				}
			}

			totalLines += lines.length;
			totalComment += commentLines;
			fileCount++;
		} catch {
			// Fehlerhafte Dateien ignorieren
		}
	}

	const avgLOC = fileCount > 0 ? totalLines / fileCount : 0;
	const avgEmpty = fileCount > 0 ? totalEmpty / fileCount : 0;
	const avgComment = fileCount > 0 ? totalComment / fileCount : 0;
	/*
	console.log(`📊 Lines of Code (Ø pro Datei):`);
	console.log(`📄 Dateien analysiert: ${fileCount}`);
	console.log(`📏 LOC total: ${avgLOC.toFixed(2)}`);
	console.log(`📭 Leerzeilen: ${avgEmpty.toFixed(2)}`);
	console.log(`💬 Kommentarzeilen: ${avgComment.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");*/

	return {
		avgLOC,
		avgEmptyLines: avgEmpty,
		avgCommentLines: avgComment,
		fileCount,
	};
}
