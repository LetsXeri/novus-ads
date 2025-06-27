// scripts/metrics/modifiability/calculateSDIInternal.mjs

import path from "path";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Berechnet Software Design Instability (SDI) pro Datei:
 * SDI = Fan-Out / (Fan-In + Fan-Out)
 */
export async function calculateSDIInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);
	const sourceFiles = project.getSourceFiles();

	let fileCount = 0;
	let totalSDI = 0;

	for (const file of sourceFiles) {
		const importDecls = file.getImportDeclarations();
		const exportDecls = file.getExportedDeclarations();

		const fanOut = importDecls.length;
		const fanIn = Array.from(exportDecls.values()).flat().length;

		// Ignoriere Dateien ohne Abhängigkeiten
		if (fanIn + fanOut === 0) continue;

		const sdi = fanOut / (fanIn + fanOut);
		totalSDI += sdi;
		fileCount++;
	}

	const avgSDI = fileCount > 0 ? totalSDI / fileCount : 0;

	/*
	console.log(`\n📊 Software Design Instability (Ø pro Datei):`);
	console.log(`📄 Dateien analysiert: ${fileCount}`);
	console.log(`🔁 Durchschnittlicher SDI: ${avgSDI.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");*/
	return {
		avgSDI,
	};
}
