import Database from "better-sqlite3";
import path from "path";

// Datenbank-Datei (lokal im Projektverzeichnis)
const dbPath = path.join(__dirname, "../data.sqlite");
export const db = new Database(dbPath);

// === Tabelle: placements (vormals campaigns) ===
db.exec(`
  CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Aktiv',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    totalEarnings REAL DEFAULT 0
  )
`);

// === Tabelle: ads (vormals targets) ===
// NEU: CHECK-Constraint verhindert negative Budgets dauerhaft.
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

// === Tabelle: placement_earnings (vormals campaign_earnings) ===
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

export default db;
