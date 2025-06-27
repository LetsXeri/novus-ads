import { Project, SyntaxKind } from "ts-morph";
import path from "path";

/**
 * LCOM4-Analyse für modulare JS/TS-Dateien inkl. anonymer & Callback-Funktionen.
 */
export async function calculateLCOM4(sourcePath) {
	const absPath = path.resolve(sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});

	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();

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

		const allFns = [...namedFunctions, ...arrowFunctions, ...inlineCallbacks];
		const fnNames = allFns.map((fn, i) => fn.getName?.() || `fn_${i}`);

		if (fnNames.length === 0) continue;

		const usageGraph = new Map();
		fnNames.forEach((name) => usageGraph.set(name, new Set()));

		for (let i = 0; i < allFns.length; i++) {
			const fn = allFns[i];
			const fnName = fnNames[i];

			const calls = fn.getDescendantsOfKind(SyntaxKind.CallExpression);
			for (const call of calls) {
				const expr = call.getExpression();
				const calledName = expr.getText();

				if (usageGraph.has(calledName)) {
					usageGraph.get(fnName).add(calledName);
					usageGraph.get(calledName).add(fnName);
				}
			}
		}

		// Connected Components zählen
		const visited = new Set();
		let components = 0;

		for (const fn of fnNames) {
			if (!visited.has(fn)) {
				components++;
				const queue = [fn];
				while (queue.length > 0) {
					const current = queue.pop();
					if (!visited.has(current)) {
						visited.add(current);
						usageGraph.get(current)?.forEach((n) => queue.push(n));
					}
				}
			}
		}

		console.log(`📄 ${file.getBaseName()} → LCOM4: ${components} Teilgraphen bei ${fnNames.length} Funktionen`);
	}

	console.log("──────────────────────────────────────────────");
}

/**
 * Berechnet LCOM4-Werte (Teilgraphen) pro Datei und den Durchschnitt über alle Dateien.
 * Ziel: Je näher an 1, desto kohäsiver (besser wiederverwendbar).
 */
export async function calculateLCOM4Internal(sourcePath) {
	const absPath = path.resolve(sourcePath);

	const project = new Project({
		compilerOptions: {
			allowJs: true,
			target: 99,
		},
	});
	project.addSourceFilesAtPaths(`${absPath}/**/*.{ts,tsx,js,jsx}`);

	const sourceFiles = project.getSourceFiles();
	let totalLCOM4 = 0;
	let countedFiles = 0;

	for (const file of sourceFiles) {
		// Alle top-level Funktionen & Funktionsausdrücke
		const functions = [
			...file.getFunctions(),
			...file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((decl) => {
				const init = decl.getInitializer();
				return init?.getKind() === SyntaxKind.ArrowFunction || init?.getKind() === SyntaxKind.FunctionExpression;
			}),
		];

		if (functions.length <= 1) {
			continue; // für LCOM4 uninteressant (kein Vergleich möglich)
		}

		// Erstelle ein Adjazenz-Set (jede Funktion = Knoten, gemeinsame Variable = Kante)
		const accesses = [];

		for (const fn of functions) {
			const accessedVars = new Set();
			fn.forEachDescendant((node) => {
				if (node.getKind() === SyntaxKind.Identifier) {
					accessedVars.add(node.getText());
				}
			});
			accesses.push(accessedVars);
		}

		// Baue Verbindungsgraph (Funktionen sind verbunden, wenn gemeinsame Variable genutzt)
		const n = accesses.length;
		const adj = Array.from({ length: n }, () => []);

		for (let i = 0; i < n; i++) {
			for (let j = i + 1; j < n; j++) {
				const shared = [...accesses[i]].some((v) => accesses[j].has(v));
				if (shared) {
					adj[i].push(j);
					adj[j].push(i);
				}
			}
		}

		// Zähle Anzahl zusammenhängender Teilgraphen (DFS)
		const visited = new Set();
		let components = 0;

		function dfs(i) {
			if (visited.has(i)) return;
			visited.add(i);
			for (const neighbor of adj[i]) {
				dfs(neighbor);
			}
		}

		for (let i = 0; i < n; i++) {
			if (!visited.has(i)) {
				dfs(i);
				components++;
			}
		}

		totalLCOM4 += components;
		countedFiles++;
	}

	const avgLCOM4 = countedFiles > 0 ? totalLCOM4 / countedFiles : 1;

	return {
		avgLCOM4,
	};
}
