/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
	moduleFileExtensions: ["ts", "js", "json"],

	// WICHTIG: TS via ts-jest transformen (fix für TS-Syntax in Tests)
	transform: {
		"^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json", isolatedModules: true }],
	},
	transformIgnorePatterns: [],

	// --- Coverage ---
	collectCoverage: true,
	// Welche Dateien in die Coverage? (Tests, Types, Migrations, Entry-Points ausnehmen)
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/__tests__/**",
		"!src/types/**",
		"!src/migrations/**",
		"!src/index.ts",
		"!src/db.ts",
		"!src/config.ts",
	],
	coverageDirectory: "<rootDir>/coverage",
	coverageReporters: ["text", "lcov", "html"],
	// Realistische Default-Thresholds (global) + Beispiel für utils strenger
	coverageThreshold: {
		global: {
			branches: 75,
			functions: 80,
			lines: 80,
			statements: 80,
		},
		"./src/utils/**": {
			branches: 85,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},

	cache: true,
	verbose: true,
};
