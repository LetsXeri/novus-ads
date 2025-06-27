import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export async function calculateAuthorsInternal(sourcePath) {
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

	let totalAuthors = 0;
	let maxAuthors = 0;
	let maxFile = "";
	let fileCount = 0;

	for (const file of fileList) {
		try {
			const relativePath = path.relative(process.cwd(), file);
			const output = execSync(`git log --pretty=format:"%an" -- "${relativePath}"`, {
				encoding: "utf-8",
			});
			const authors = new Set(
				output
					.split("\n")
					.map((a) => a.trim())
					.filter(Boolean)
			);

			const count = authors.size;
			totalAuthors += count;
			fileCount++;

			if (count > maxAuthors) {
				maxAuthors = count;
				maxFile = path.basename(file);
			}
		} catch {
			// ignore
		}
	}

	const avgAuthors = fileCount > 0 ? totalAuthors / fileCount : 0;

	/*
	console.log(`\n👥 Anzahl Autoren pro Datei:`);
	console.log(`📄 Dateien analysiert: ${fileCount}`);
	console.log(`👤 Ø Autoren: ${avgAuthors.toFixed(2)}`);
	console.log(`📌 Max Autoren: ${maxAuthors} in '${maxFile}'`);
	console.log("──────────────────────────────────────────────");
    */

	return { avgAuthors, maxAuthors, maxFile };
}
