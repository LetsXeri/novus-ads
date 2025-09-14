export type Placement = {
	id: number;
	name: string; // falls vorhanden
	active?: boolean; // falls vorhanden
	totalEarnings?: number; // falls vorhanden
};

type CampaignType = {
	id: number;
	name: string;
	status: "Aktiv" | "Pausiert" | "Beendet";
	targets: number[];
};

type CampaignEarningsEntry = {
	id: number;
	campaignId: number;
	year: number;
	month: number;
	amount: number;
};
