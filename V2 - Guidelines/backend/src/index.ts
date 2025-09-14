import express from "express";
import cors from "cors";

import placementsRouter from "./placements";
import adsRouter from "./ads";

const app = express();
app.use(express.json());
app.use(
	cors({
		origin: "http://localhost:5173",
	})
);

// Neue, klare Terminologie
app.use("/placements", placementsRouter);
app.use("/ads", adsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`🚀 API läuft auf http://localhost:${PORT}`);
	console.log("📌 Endpunkte:");
	console.log("   /placements   (vormals /campaigns)");
	console.log("   /ads          (vormals /targets)");
	if (process.env.ENABLE_LEGACY_ALIASES === "1") {
		console.log("   ⚠️ Legacy aktiv: /campaigns, /targets");
	}
});
