// scripts/metrics/analyzability/calculateCCInternal.mjs
import path from "path";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Cyclomatic Complexity: Zählt Entscheidungsstellen pro Datei
 */
export async function calculateCCInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const project = new Project({
		compilerOptions: { allowJs: true, target: 99 },
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let totalCC = 0;
	let maxCC = 0;
	let maxFile = "";

	const decisionKinds = new Set([
		SyntaxKind.IfStatement,
		SyntaxKind.SwitchStatement,
		SyntaxKind.ForStatement,
		SyntaxKind.ForOfStatement,
		SyntaxKind.ForInStatement,
		SyntaxKind.WhileStatement,
		SyntaxKind.CatchClause,
		SyntaxKind.ConditionalExpression,
	]);

	for (const file of sourceFiles) {
		let cc = 0;

		file.forEachDescendant((node) => {
			const kind = node.getKind();

			if (decisionKinds.has(kind)) {
				cc++;
			} else if (kind === SyntaxKind.BinaryExpression) {
				const op = node.getOperatorToken().getText();
				if (op === "&&" || op === "||") cc++;
			}
		});

		if (cc > maxCC) {
			maxCC = cc;
			maxFile = file.getBaseName();
		}

		totalCC += cc;
	}

	const avgCC = sourceFiles.length > 0 ? totalCC / sourceFiles.length : 0;

	console.log(`\n📊 Zusammenfassung Cyclomatic Complexity:`);
	console.log(`📄 Dateien analysiert: ${sourceFiles.length}`);
	console.log(`🧮 Durchschnittliche CC: ${avgCC.toFixed(2)}`);
	console.log(`📌 Höchste CC: ${maxCC} in '${maxFile}'`);
	console.log("──────────────────────────────────────────────");

	return {
		avgCC,
		maxCC,
		maxFile,
	};
}
