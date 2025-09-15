// Ad = vormals Target
// Repräsentiert eine konkrete Werbeanzeige / Ziel-URL innerhalb eines Placements

export type Ad = {
	id: number;
	url: string;
	weight: number;
	limit: number | null;
	calls: number;
	budget: number | null; // Restbudget
	initialBudget: number | null; // Startbudget (neu, für Ausgaben)
	placementId: number | null;
	createdAt?: string; // erstellt am
};
