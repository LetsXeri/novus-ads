import Database from "better-sqlite3";
import path from "path";
import { config } from "./config";

// Wir unterstützen Pfade wie "./data.sqlite" oder "/data/data.sqlite".
// "file:"-Schema erlauben wir weiterhin, strippen es aber für better-sqlite3.
function normalizeSqlitePath(input: string): string {
	if (input.startsWith("file:")) {
		return input.replace(/^file:/, "");
	}
	return input;
}

const dbPath = normalizeSqlitePath(config.databaseUrl);

// Bei relativen Pfaden relativ zum backend-Verzeichnis ablegen
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, "..", dbPath);

export const db = new Database(resolvedPath);

// Tabellen (inkl. Budget-Constraint)
db.exec(`
  CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Aktiv',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    totalEarnings REAL DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    weight INTEGER NOT NULL,
    "limit" INTEGER,
    calls INTEGER DEFAULT 0,
    budget REAL,
    placementId INTEGER,
    CHECK (budget IS NULL OR budget >= 0)
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
