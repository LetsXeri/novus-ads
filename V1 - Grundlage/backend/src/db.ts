import Database from "better-sqlite3";
import path from "path";

// Datenbank-Datei (lokal im Projektverzeichnis)
const dbPath = path.join(__dirname, "../data.sqlite");
export const db = new Database(dbPath);

// === Tabelle: campaigns ===
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Aktiv',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    totalEarnings REAL DEFAULT 0
  )
`);

// === Tabelle: targets ===
db.exec(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    weight INTEGER NOT NULL,
    "limit" INTEGER,
    calls INTEGER DEFAULT 0,
    budget REAL,
    campaignId INTEGER
  )
`);

// === Tabelle: campaign_earnings (monatliche Einnahmen) ===
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaignId INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    UNIQUE(campaignId, year, month)
  )
`);
