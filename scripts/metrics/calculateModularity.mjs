import madge from "madge";

/**
 * Bewertet ACD auf einer Skala von 0–10 (niedriger ACD = besser)
 */
function calculateScoreACD(acd) {
	if (acd <= 1) return 10;
	if (acd >= 5) return 0;
	return ((5 - acd) / 4) * 10;
}

/**
 * Bewertet PC auf einer Skala von 0–10 (niedriger PC = besser)
 */
function calculateScorePC(pcPercent) {
	if (pcPercent <= 5) return 10;
	if (pcPercent >= 20) return 0;
	return ((20 - pcPercent) / 15) * 10;
}

/**
 * Bewertet Max Reachable auf einer Skala von 0–10 (weniger ist besser)
 * Erwartet absolute Anzahl und teilt durch Gesamtanzahl n
 */
function calculateScoreMaxReachable(max, total) {
	const ratio = max / total;
	if (ratio <= 0.2) return 10;
	if (ratio >= 1.0) return 0;
	return ((1 - ratio) / 0.8) * 10;
}

/**
 * Berechnet ACD, PC, MaxReachable und Modularitäts-Score
 */
export async function calculateModularity(pathToSrc) {
	try {
		const result = await madge(pathToSrc, {
			fileExtensions: ["ts", "tsx"],
			includeNpm: false,
		});

		const graph = result.obj();
		const components = Object.keys(graph);
		const n = components.length;

		function getReachableModules(module, visited = new Set()) {
			if (!graph[module] || visited.has(module)) return;
			visited.add(module);
			for (const dep of graph[module]) {
				getReachableModules(dep, visited);
			}
		}

		let totalReachable = 0;
		let maxReachable = 0;
		let maxModule = "";

		for (const mod of components) {
			const visited = new Set();
			getReachableModules(mod, visited);
			visited.delete(mod); // sich selbst nicht mitzählen

			const size = visited.size;
			totalReachable += size;

			if (size > maxReachable) {
				maxReachable = size;
				maxModule = mod;
			}
		}

		const acd = totalReachable / n;
		const pc = acd / n;
		const pcPercent = pc * 100;

		// Scores berechnen
		const scoreACD = calculateScoreACD(acd);
		const scorePC = calculateScorePC(pcPercent);
		const scoreMaxReachable = calculateScoreMaxReachable(maxReachable, n);

		// Gewichtung: 40% ACD, 40% PC, 20% Max
		const modularityScore = 0.4 * scoreACD + 0.4 * scorePC + 0.2 * scoreMaxReachable;

		// Ausgabe

		console.log(`📊 ACD: ${acd.toFixed(2)} → Score: ${scoreACD.toFixed(1)}`);
		console.log(`🔁 PC: ${pcPercent.toFixed(2)} % → Score: ${scorePC.toFixed(1)}`);
		console.log(`📌 Max Reachable: ${maxReachable} von '${maxModule}' → Score: ${scoreMaxReachable.toFixed(1)}`);
		console.log(`🧮 Modularitäts-Score (0–10): ${modularityScore.toFixed(2)}`);
		console.log("──────────────────────────────────────────────");
	} catch (err) {
		console.error("❌ Fehler beim ACD-Berechnen:", err);
	}
}
