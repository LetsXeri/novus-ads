export type TargetType = {
	id: number;
	url: string;
	weight: number; // z. B. 70 = 70% Wahrscheinlichkeit
	limit: number | null; // max. Aufrufe, null = unbegrenzt
	calls: number; // bisherige Aufrufe
	budget: number | null;
	campaignId: number | null;
};
