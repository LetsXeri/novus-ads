import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis";
import { db } from "./db";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
	const visits = await redis.incr("visits");
	res.send(`Hello World! This endpoint was visited ${visits} times.`);
});

app.get("/campaigns", (req: Request, res: Response) => {
	try {
		const stmt = db.prepare("SELECT * FROM campaigns ORDER BY createdAt DESC");
		const campaigns = stmt.all();
		res.json(campaigns);
	} catch (err) {
		console.error("❌ Fehler beim Abrufen:", err);
		res.status(500).send("Interner Fehler");
	}
});

app.post("/campaigns", (req: Request, res: Response) => {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Name fehlt" });
	}

	try {
		const stmt = db.prepare("INSERT INTO campaigns (name, createdAt) VALUES (?, datetime('now'))");

		const result = stmt.run(name);
		return res.json({ id: result.lastInsertRowid, name });
	} catch (err) {
		console.error("❌ Fehler beim Speichern:", err);
		return res.status(500).json({ error: "Fehler beim Speichern" });
	}
});

app.listen(port, () => {
	console.log(`🚀 Server läuft auf http://localhost:${port}`);
});
