import { Project, SyntaxKind } from "ts-morph";
import path from "path";

/**
 * Analysiert die Wiederverwendbarkeit anhand:
 * - Anzahl aller Funktionen (inkl. anonymer & Callback-Funktionen)
 * - Ø Parameteranzahl pro Funktion
 */
export async function calculateWMC(sourcePath) {
	const absPath = path.resolve(sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let totalFunctions = 0;
	let totalParams = 0;
	let fileWithMostFunctions = "";
	let maxFunctions = 0;

	for (const file of sourceFiles) {
		const namedFunctions = file.getFunctions();

		const arrowFunctions = file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((decl) => {
			const init = decl.getInitializer();
			return init?.getKind() === SyntaxKind.ArrowFunction || init?.getKind() === SyntaxKind.FunctionExpression;
		});

		const inlineCallbacks = file
			.getDescendantsOfKind(SyntaxKind.CallExpression)
			.flatMap((call) =>
				call
					.getArguments()
					.filter(
						(arg) => arg.getKind() === SyntaxKind.ArrowFunction || arg.getKind() === SyntaxKind.FunctionExpression
					)
			);

		const allFunctions = [...namedFunctions, ...arrowFunctions, ...inlineCallbacks];
		const functionCount = allFunctions.length;

		if (functionCount > maxFunctions) {
			maxFunctions = functionCount;
			fileWithMostFunctions = file.getBaseName();
		}

		totalFunctions += functionCount;

		for (const fn of allFunctions) {
			try {
				const params = fn.getParameters?.() || [];
				totalParams += params.length;
			} catch {
				// bei anonymer oder fehlerhafter Funktion: ignoriere
			}
		}
	}

	const fileCount = sourceFiles.length;
	const avgFunctionsPerFile = fileCount > 0 ? totalFunctions / fileCount : 0;
	const avgParamsPerFunction = totalFunctions > 0 ? totalParams / totalFunctions : 0;

	console.log(`🧮 Gesamtfunktionen: ${totalFunctions}`);
	console.log(`📄 Dateien analysiert: ${fileCount}`);
	console.log(`⚖️ Ø Funktionen pro Datei: ${avgFunctionsPerFile.toFixed(2)}`);
	console.log(`🔢 Ø Parameter pro Funktion: ${avgParamsPerFunction.toFixed(2)}`);
	console.log(`📌 Datei mit meisten Funktionen: ${fileWithMostFunctions} (${maxFunctions})`);
	console.log("──────────────────────────────────────────────");
}

/**
 * Interne Funktion zur Berechnung von WMC-relevanten Werten.
 * Gibt ein Objekt mit Ø Funktionen pro Datei und Ø Parametern zurück.
 */
export async function calculateWMCInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let totalFunctions = 0;
	let totalParams = 0;

	for (const file of sourceFiles) {
		const namedFunctions = file.getFunctions();

		const arrowFunctions = file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((decl) => {
			const init = decl.getInitializer();
			return init?.getKind() === SyntaxKind.ArrowFunction || init?.getKind() === SyntaxKind.FunctionExpression;
		});

		const inlineCallbacks = file
			.getDescendantsOfKind(SyntaxKind.CallExpression)
			.flatMap((call) =>
				call
					.getArguments()
					.filter(
						(arg) => arg.getKind() === SyntaxKind.ArrowFunction || arg.getKind() === SyntaxKind.FunctionExpression
					)
			);

		const allFunctions = [...namedFunctions, ...arrowFunctions, ...inlineCallbacks];
		totalFunctions += allFunctions.length;

		for (const fn of allFunctions) {
			try {
				const params = fn.getParameters?.() || [];
				totalParams += params.length;
			} catch {
				// bei Fehler: Funktion überspringen
			}
		}
	}

	const fileCount = sourceFiles.length;
	const avgFunctionsPerFile = fileCount > 0 ? totalFunctions / fileCount : 0;
	const avgParamsPerFunction = totalFunctions > 0 ? totalParams / totalFunctions : 0;

	return {
		avgFunctionsPerFile,
		avgParamsPerFunction,
	};
}
