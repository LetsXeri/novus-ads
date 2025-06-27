import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export async function calculateChurnInternal(sourcePath) {
	const absPath = path.resolve(sourcePath);
	const fileList = [];

	function walk(dir) {
		const files = fs.readdirSync(dir);
		for (const file of files) {
			const fullPath = path.join(dir, file);
			if (fs.statSync(fullPath).isDirectory()) {
				walk(fullPath);
			} else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
				fileList.push(fullPath);
			}
		}
	}

	walk(absPath);

	let totalChurn = 0;
	let maxChurn = 0;
	let maxFile = "";
	let fileCount = 0;

	for (const file of fileList) {
		try {
			const relativePath = path.relative(process.cwd(), file);
			const output = execSync(`git log --pretty=tformat: --numstat -- "${relativePath}"`, {
				encoding: "utf-8",
			});

			const churn = output
				.split("\n")
				.map((line) => line.trim().split("\t"))
				.filter((cols) => cols.length === 3)
				.reduce((sum, [added, deleted]) => {
					const a = parseInt(added) || 0;
					const d = parseInt(deleted) || 0;
					return sum + a + d;
				}, 0);

			totalChurn += churn;
			fileCount++;

			if (churn > maxChurn) {
				maxChurn = churn;
				maxFile = path.basename(file);
			}
		} catch {
			// ignore errors (e.g. file not under git)
		}
	}

	const avgChurn = fileCount > 0 ? totalChurn / fileCount : 0;

	/*
	console.log(`\n📊 Code Churn pro Datei:`);
	console.log(`📄 Dateien analysiert: ${fileCount}`);
	console.log(`🌀 Ø Churn: ${avgChurn.toFixed(2)}`);
	console.log(`📌 Max Churn: ${maxChurn} in '${maxFile}'`);
	console.log("──────────────────────────────────────────────");*/
	return { avgChurn, maxChurn, maxFile };
}
