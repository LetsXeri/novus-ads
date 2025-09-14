import { Placement, PlacementEarningsEntry } from "../types/placement";

const API_URL = import.meta.env.VITE_API_URL;

// Alle Placements abrufen
export const fetchPlacements = async (): Promise<Placement[]> => {
	const res = await fetch(`${API_URL}/placements`);

	if (!res.ok) {
		throw new Error("Fehler beim Laden der Placements");
	}

	return res.json();
};

// Einnahmen eines Placements abrufen
export const getPlacementEarnings = async (placementId: number): Promise<PlacementEarningsEntry[]> => {
	const res = await fetch(`${API_URL}/placements/${placementId}/earnings`);
	if (!res.ok) throw new Error("Fehler beim Laden der Einnahmen");
	return res.json();
};
