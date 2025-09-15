// /backend/src/types/ad.ts

export type Ad = {
	id: number;
	url: string;
	weight: number; // z. B. 70 = 70% Wahrscheinlichkeit
	limit: number | null; // max. Aufrufe, null = unbegrenzt
	calls: number; // bisherige Aufrufe
	budget: number | null; // Restbudget
	initialBudget: number | null; // Startbudget (neu für Ausgaben)
	placementId: number | null;
	createdAt: string; // ISO-Zeitstempel der Erstellung
};
