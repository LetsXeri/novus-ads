import express from "express";
import cors from "cors";

import campaigns from "./campaigns";
import targets from "./targets";

const app = express();
app.use(express.json());
app.use(
	cors({
		origin: "http://localhost:5173",
	})
);

app.use("/campaigns", campaigns);
app.use("/targets", targets);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`🚀 API läuft auf http://localhost:${PORT}`);
});
