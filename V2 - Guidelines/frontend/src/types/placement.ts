// Domain: Placement (= vormals "Campaign")
// Hinweis: Wir lassen einige Felder optional, weil der Backend-Endpoint /placements
// nicht zwingend alle Spalten zurückgeben muss (z. B. createdAt, totalEarnings).

export type Placement = {
	id: number;
	name: string;
	status: "Aktiv" | "Pausiert" | "Beendet";
	// Falls ihr im UI eine Zählung/Referenz auf Ads braucht, könnt ihr eine Liste an IDs halten.
	// Das Backend liefert diese aktuell nicht automatisch, daher optional:
	ads?: number[];
	createdAt?: string;
	totalEarnings?: number;
};

// Monatswerte der Einnahmen eines Placements.
// Der Backend-Endpoint /placements/:id/earnings liefert (year, month, amount).
export type PlacementEarningsEntry = {
	year: number;
	month: number;
	amount: number;
};
