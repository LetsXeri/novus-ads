export type Ad = {
	id: number;
	url: string;
	weight: number; // z. B. 70 = 70% Wahrscheinlichkeit relativ
	limit: number | null; // max. Aufrufe, null = unbegrenzt
	calls: number; // bisherige Aufrufe
	budget: number | null; // ggf. später auf Cents umstellen
	placementId: number | null; // vormals campaignId
};
