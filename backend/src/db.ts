import Database from "better-sqlite3";
import path from "path";

// DB-Datei im Projektverzeichnis speichern
const dbPath = path.join(__dirname, "../data.sqlite");

export const db = new Database(dbPath);

// Tabelle erstellen (wenn nicht existiert)
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
