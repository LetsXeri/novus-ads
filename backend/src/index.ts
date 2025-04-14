import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error", err));
await redis.connect();

const db = await mysql.createPool({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
	waitForConnections: true,
	connectionLimit: 10,
});

app.get("/api/campaigns", async (_, res) => {
	const [rows] = await db.query("SELECT * FROM links");

	res.json(rows);
});

app.listen(3001, () => {
	console.log("🚀 Backend läuft auf http://localhost:3001");
});
