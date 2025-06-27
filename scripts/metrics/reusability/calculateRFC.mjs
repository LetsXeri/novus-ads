import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Berechnet RFC (Response For a File) = eigene Funktionen + aufgerufene externe Funktionen
 * berücksichtigt auch anonyme und Callback-Funktionen (z. B. Express)
 */
export async function calculateRFC(sourcePath) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const absPath = path.resolve(__dirname, sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let maxRFC = 0;
	let maxFile = "";
	let totalRFC = 0;

	for (const file of sourceFiles) {
		const declaredFunctions = new Set();

		// klassische Funktionen
		file.getFunctions().forEach((fn) => {
			if (fn.getName()) declaredFunctions.add(fn.getName());
		});

		// Arrow- und Function Expressions
		file.getVariableDeclarations().forEach((decl) => {
			const init = decl.getInitializer();
			if (init?.getKind() === SyntaxKind.ArrowFunction || init?.getKind() === SyntaxKind.FunctionExpression) {
				declaredFunctions.add(decl.getName());
			}
		});

		// Anonyme Funktionen (z. B. Callbacks in app.get(...))
		const anonymousFunctions = file
			.getDescendantsOfKind(SyntaxKind.CallExpression)
			.flatMap((call) =>
				call
					.getArguments()
					.filter(
						(arg) => arg.getKind() === SyntaxKind.ArrowFunction || arg.getKind() === SyntaxKind.FunctionExpression
					)
			);

		// Alle CallExpressions analysieren
		const callExprs = file.getDescendantsOfKind(SyntaxKind.CallExpression);
		const calledFunctions = new Set();

		for (const call of callExprs) {
			const expr = call.getExpression();
			if (expr.getKind() === SyntaxKind.Identifier) {
				const name = expr.getText();
				if (!declaredFunctions.has(name)) {
					calledFunctions.add(name);
				}
			} else if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
				calledFunctions.add(expr.getText());
			}
		}

		const ownFunctionCount = declaredFunctions.size + anonymousFunctions.length;
		const externalCalls = calledFunctions.size;
		const rfc = ownFunctionCount + externalCalls;

		totalRFC += rfc;

		if (rfc > maxRFC) {
			maxRFC = rfc;
			maxFile = file.getBaseName();
		}

		console.log(
			`📄 ${file.getBaseName()} → RFC: ${rfc} = ${ownFunctionCount} eigene Funktionen + ${externalCalls} Aufrufe`
		);
	}

	const avgRFC = sourceFiles.length > 0 ? totalRFC / sourceFiles.length : 0;

	console.log("\n📊 Zusammenfassung:");
	console.log(`📄 Dateien analysiert: ${sourceFiles.length}`);
	console.log(`🧮 Durchschnittlicher RFC: ${avgRFC.toFixed(2)}`);
	console.log(`📌 Höchster RFC: ${maxRFC} in '${maxFile}'`);
	console.log("──────────────────────────────────────────────");
}

/**
 * Interne Funktion zur Berechnung des durchschnittlichen RFC (Response for a File).
 * Berücksichtigt:
 * - deklarierte Funktionen
 * - Arrow- & FunctionExpressions
 * - anonyme Callback-Funktionen (als Argumente übergeben)
 */
export async function calculateRFCInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let totalRFC = 0;

	for (const file of sourceFiles) {
		const declaredFunctions = new Set(
			file
				.getFunctions()
				.map((fn) => fn.getName())
				.filter(Boolean)
		);

		// auch Arrow Functions & Function Expressions als deklarierte Funktionen behandeln
		file.getVariableDeclarations().forEach((decl) => {
			const init = decl.getInitializer();
			if (init?.getKind() === SyntaxKind.ArrowFunction || init?.getKind() === SyntaxKind.FunctionExpression) {
				declaredFunctions.add(decl.getName());
			}
		});

		// CallExpressions analysieren
		const callExprs = file.getDescendantsOfKind(SyntaxKind.CallExpression);
		const calledFunctions = new Set();
		let anonymousCallbackCount = 0;

		for (const call of callExprs) {
			const expr = call.getExpression();

			// Fall 1: direkte Aufrufe (z. B. logError())
			if (expr.getKind() === SyntaxKind.Identifier) {
				const name = expr.getText();
				if (!declaredFunctions.has(name)) {
					calledFunctions.add(name);
				}
			}
			// Fall 2: Methodenaufrufe (z. B. axios.get())
			else if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
				calledFunctions.add(expr.getText());
			}

			// Fall 3: anonyme Funktionen als Argument
			for (const arg of call.getArguments()) {
				if (arg.getKind() === SyntaxKind.ArrowFunction || arg.getKind() === SyntaxKind.FunctionExpression) {
					anonymousCallbackCount++;
				}
			}
		}

		const ownFunctionCount = declaredFunctions.size + anonymousCallbackCount;
		const externalCalls = calledFunctions.size;
		const rfc = ownFunctionCount + externalCalls;

		totalRFC += rfc;
	}

	const fileCount = sourceFiles.length;
	const avgRFC = fileCount > 0 ? totalRFC / fileCount : 0;

	return {
		avgRFC,
	};
}
