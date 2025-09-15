import Database from "better-sqlite3";
import path from "path";
import { config } from "./config";

function normalizeSqlitePath(input: string): string {
	if (input.startsWith("file:")) return input.replace(/^file:/, "");
	return input;
}

const dbPath = normalizeSqlitePath(config.databaseUrl);
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, "..", dbPath);
export const db = new Database(resolvedPath);

// placements
db.exec(`
  CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Aktiv',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    totalEarnings REAL DEFAULT 0
  )
`);

// ads (NEU: createdAt, initialBudget; CHECK verhindert negative Budgets)
db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    weight INTEGER NOT NULL,
    "limit" INTEGER,
    calls INTEGER DEFAULT 0,
    budget REAL,
    initialBudget REAL,
    placementId INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (budget IS NULL OR budget >= 0),
    CHECK (initialBudget IS NULL OR initialBudget >= 0)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS placement_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placementId INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    UNIQUE(placementId, year, month)
  )
`);
