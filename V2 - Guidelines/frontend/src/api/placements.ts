import { Placement, PlacementEarningsEntry } from "../types/placement";
import { API_URL } from "../config";

export async function fetchPlacements(): Promise<Placement[]> {
	const res = await fetch(`${API_URL}/placements`);
	if (!res.ok) throw new Error("Fehler beim Laden der Placements");
	return res.json();
}

export async function getPlacementEarnings(id: number): Promise<PlacementEarningsEntry[]> {
	const res = await fetch(`${API_URL}/placements/${id}/earnings`);
	if (!res.ok) throw new Error("Fehler beim Laden der Einnahmen");
	return res.json();
}
