import fs from "fs";
import path from "path";
import escomplex from "typhonjs-escomplex";
const { createModuleReport } = escomplex;

/**
 * Berechnet die Halstead-Metriken (Volume, Difficulty, Effort) für eine Codebasis.
 */
export async function calculateHalsteadInternal(sourcePath) {
	const files = await collectSourceFiles(sourcePath);
	let totalEffort = 0;
	let totalVolume = 0;
	let totalDifficulty = 0;
	let validFiles = 0;

	for (const filePath of files) {
		try {
			const code = fs.readFileSync(filePath, "utf8");

			const report = createModuleReport(code);
			if (!report.aggregate?.halstead || report.functions?.length === 0) continue;

			const { volume, difficulty, effort } = report.aggregate.halstead;

			totalEffort += effort || 0;
			totalVolume += volume || 0;
			totalDifficulty += difficulty || 0;
			validFiles++;
		} catch (e) {
			// Datei überspringen bei Parsefehler (z.B. durch JSX/TSX)
		}
	}

	const avgEffort = validFiles > 0 ? totalEffort / validFiles : 0;
	const avgVolume = validFiles > 0 ? totalVolume / validFiles : 0;
	const avgDifficulty = validFiles > 0 ? totalDifficulty / validFiles : 0;

	console.log(`\n📊 Halstead-Metriken (Durchschnitt pro Datei):`);
	console.log(`📄 Dateien analysiert: ${validFiles}`);
	console.log(`🧮 Volume: ${avgVolume.toFixed(2)}`);
	console.log(`⚙️ Difficulty: ${avgDifficulty.toFixed(2)}`);
	console.log(`📈 Effort: ${avgEffort.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");

	return {
		avgEffort,
		avgVolume,
		avgDifficulty,
	};
}

async function collectSourceFiles(dir) {
	const exts = [".ts", ".js"]; // Keine tsx/jsx mehr
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
