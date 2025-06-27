// scripts/metrics/modifiability/calculateStructuralDebtInternal.mjs

import madge from "madge";
import path from "path";

const disallowedImports = [
	{ from: "features", to: "app" },
	{ from: "utils", to: "features" },
];

function violatesImportRule(fromPath, toPath) {
	return disallowedImports.some((rule) => fromPath.includes(rule.from) && toPath.includes(rule.to));
}

export async function calculateStructuralDebtInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const madgeResult = await madge(absPath, {
		tsConfig: path.join(absPath, "../tsconfig.json"),
		fileExtensions: ["ts", "tsx", "js", "jsx"],
		includeNpm: false,
	});

	const circular = await madgeResult.circular();
	const deps = madgeResult.obj();

	let importViolations = 0;
	let totalEdges = 0;

	for (const [from, targets] of Object.entries(deps)) {
		for (const to of targets) {
			totalEdges++;
			if (violatesImportRule(from, to)) {
				importViolations++;
			}
		}
	}

	// Schwere des strukturellen Schuldenindex:
	const structuralDebtIndex = (circular.length + importViolations) / Math.max(totalEdges, 1);

	console.log(`\n📁 Projekt: ${absPath}`);
	console.log(`\n📊 Structural Debt Index Analyse:`);
	console.log(`🔁 Zyklische Abhängigkeiten: ${circular.length}`);
	console.log(`⛔ Verbotene Importe: ${importViolations}`);
	console.log(`🔗 Gesamtabhängigkeiten: ${totalEdges}`);
	console.log(`📉 Structural Debt Index: ${structuralDebtIndex.toFixed(4)}`);
	console.log("──────────────────────────────────────────────");

	return {
		cycles: circular.length,
		importViolations,
		totalEdges,
		structuralDebtIndex,
	};
}
