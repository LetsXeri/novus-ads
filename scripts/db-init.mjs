import axios from "axios";

const API_BASE = "http://localhost:3000"; // ggf. anpassen

const campaigns = [
	{ name: "Kampagne Frühling 2025" },
	{ name: "Sommer-Sale Facebook Ads" },
	{ name: "Newsletter Kampagne Q3" },
	{ name: "Black Friday Countdown" },
];

async function seedCampaigns() {
	for (const campaign of campaigns) {
		try {
			const response = await axios.post(`${API_BASE}/campaigns`, campaign);
			console.log("✅ Erstellt:", response.data);
		} catch (error) {
			console.error("❌ Fehler beim Erstellen:", campaign.name, error.message);
		}
	}
}

seedCampaigns();
