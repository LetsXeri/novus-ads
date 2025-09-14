// Ad = vormals Target
// Repräsentiert eine konkrete Werbeanzeige / Ziel-URL innerhalb eines Placements

export type Ad = {
	id: number;
	url: string;
	weight: number; // z. B. 70 = 70% Wahrscheinlichkeit
	limit: number | null; // max. Aufrufe, null = unbegrenzt
	calls: number; // bisherige Aufrufe
	budget: number | null; // Budget in €, null = unbegrenzt
	placementId: number | null; // vormals campaignId
};
