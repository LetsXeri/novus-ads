import { Ad } from "../types/ad";

const API_URL = import.meta.env.VITE_API_URL;

// Alle Ads abrufen
export const getAds = async (): Promise<Ad[]> => {
	const res = await fetch(`${API_URL}/ads`);
	if (!res.ok) throw new Error("Fehler beim Laden der Ads");
	return res.json();
};

// Neue Ad anlegen
export const createAd = async (data: Partial<Ad>) => {
	await fetch(`${API_URL}/ads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

// Ad aktualisieren
export const updateAd = async (id: number, data: Partial<Ad>) => {
	await fetch(`${API_URL}/ads/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

// Ad löschen
export const deleteAd = async (id: number) => {
	await fetch(`${API_URL}/ads/${id}`, { method: "DELETE" });
};
