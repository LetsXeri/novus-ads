import path from "path";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Berechnet Halstead-Metriken über Operatoren und Operanden mit ts-morph.
 */
export async function calculateHalsteadInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});

	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);
	const sourceFiles = project.getSourceFiles();

	let totalVolume = 0;
	let totalDifficulty = 0;
	let totalEffort = 0;
	let validFiles = 0;

	// Erweiterte Menge an Operator-Tokens
	const operatorTokenKinds = new Set([
		SyntaxKind.PlusToken,
		SyntaxKind.MinusToken,
		SyntaxKind.AsteriskToken,
		SyntaxKind.SlashToken,
		SyntaxKind.PercentToken,
		SyntaxKind.EqualsToken,
		SyntaxKind.EqualsEqualsToken,
		SyntaxKind.EqualsEqualsEqualsToken,
		SyntaxKind.ExclamationEqualsToken,
		SyntaxKind.ExclamationEqualsEqualsToken,
		SyntaxKind.LessThanToken,
		SyntaxKind.GreaterThanToken,
		SyntaxKind.PlusEqualsToken,
		SyntaxKind.MinusEqualsToken,
		SyntaxKind.AsteriskEqualsToken,
		SyntaxKind.SlashEqualsToken,
		SyntaxKind.AmpersandAmpersandToken,
		SyntaxKind.BarBarToken,
		SyntaxKind.DotToken,
		SyntaxKind.ArrowToken,
		SyntaxKind.OpenParenToken,
		SyntaxKind.CloseParenToken,
		SyntaxKind.CommaToken,
	]);

	for (const file of sourceFiles) {
		const operatorKinds = new Set();
		const operandKinds = new Set();
		let totalOperators = 0;
		let totalOperands = 0;

		file.forEachDescendant((node) => {
			const kind = node.getKind();

			if (operatorTokenKinds.has(kind)) {
				operatorKinds.add(kind);
				totalOperators++;
			}

			// Operanden (Identifier, Literale, boolsche Werte)
			if (
				kind === SyntaxKind.Identifier ||
				kind === SyntaxKind.NumericLiteral ||
				kind === SyntaxKind.StringLiteral ||
				kind === SyntaxKind.TrueKeyword ||
				kind === SyntaxKind.FalseKeyword
			) {
				operandKinds.add(node.getText());
				totalOperands++;
			}
		});

		const n1 = operatorKinds.size;
		const n2 = operandKinds.size;
		const N1 = totalOperators;
		const N2 = totalOperands;

		if (n1 === 0 || n2 === 0) {
			// console.log(`⚠️ Übersprungen: ${file.getBaseName()} – n1=${n1}, n2=${n2}`);
			continue;
		}

		const vocabulary = n1 + n2;
		const length = N1 + N2;
		const volume = length * Math.log2(vocabulary);
		const difficulty = (n1 / 2) * (N2 / n2);
		const effort = volume * difficulty;

		totalVolume += volume;
		totalDifficulty += difficulty;
		totalEffort += effort;
		validFiles++;
	}

	const avgVolume = validFiles > 0 ? totalVolume / validFiles : 0;
	const avgDifficulty = validFiles > 0 ? totalDifficulty / validFiles : 0;
	const avgEffort = validFiles > 0 ? totalEffort / validFiles : 0;
	/*
	console.log(`\n📊 Halstead-Metriken (Durchschnitt pro Datei):`);
	console.log(`📄 Dateien analysiert: ${validFiles}`);
	console.log(`🧮 Volume: ${avgVolume.toFixed(2)}`);
	console.log(`⚙️ Difficulty: ${avgDifficulty.toFixed(2)}`);
	console.log(`📈 Effort: ${avgEffort.toFixed(2)}`);
	console.log("──────────────────────────────────────────────");*/

	return {
		avgVolume,
		avgDifficulty,
		avgEffort,
	};
}
