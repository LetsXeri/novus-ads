import { CampaignEarningsEntry, CampaignType } from "../types/campaign";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchCampaigns = async (): Promise<CampaignType[]> => {
	const res = await fetch(`${API_URL}/campaigns`);

	if (!res.ok) {
		throw new Error("Fehler beim Laden der Kampagnen");
	}

	return res.json();
};

export const getCampaignEarnings = async (campaignId: number): Promise<CampaignEarningsEntry[]> => {
	const res = await fetch(`${import.meta.env.VITE_API_URL}/campaigns/${campaignId}/earnings`);
	if (!res.ok) throw new Error("Fehler beim Laden der Einnahmen");
	return res.json();
};
