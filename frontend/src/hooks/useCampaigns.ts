// src/hooks/useCampaigns.ts
import { useEffect, useState } from "react";
import { CampaignType } from "../types/campaign";
import { fetchCampaigns } from "../api/campaigns";

export const useCampaigns = () => {
	const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchCampaigns();
				setCampaigns(data);
			} catch (err: any) {
				setError(err.message || "Unbekannter Fehler");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	return { campaigns, loading, error };
};
