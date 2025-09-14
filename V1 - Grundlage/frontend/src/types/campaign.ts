export type CampaignType = {
	id: number;
	name: string;
	status: "Aktiv" | "Pausiert" | "Beendet";
	targets: number[];
};

export type CampaignEarningsEntry = {
	id: number;
	campaignId: number;
	year: number;
	month: number;
	amount: number;
};
