/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
	moduleFileExtensions: ["ts", "js", "json"],

	transform: {
		"^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
	},
	transformIgnorePatterns: [],

	// --- Coverage: fokussiert & realistisch ---
	collectCoverage: true,
	collectCoverageFrom: ["src/utils/**/*.ts", "src/placements.ts", "src/ads.ts", "src/middleware/**/*.ts"],
	coverageDirectory: "<rootDir>/coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 70,
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
		"./src/placements.ts": {
			branches: 65,
			functions: 75,
			lines: 75,
			statements: 75,
		},
		"./src/ads.ts": {
			branches: 65,
			functions: 75,
			lines: 75,
			statements: 75,
		},
		"./src/middleware/**": {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	cache: true,
	verbose: true,
};
