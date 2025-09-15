import { Ad } from "../types/ad";
import { API_URL } from "../config";

export const getAds = async (): Promise<Ad[]> => {
	const res = await fetch(`${API_URL}/ads`);
	if (!res.ok) throw new Error("Fehler beim Laden der Ads");
	return res.json();
};

export const createAd = async (data: Partial<Ad>) => {
	await fetch(`${API_URL}/ads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const updateAd = async (id: number, data: Partial<Ad>) => {
	await fetch(`${API_URL}/ads/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const deleteAd = async (id: number) => {
	await fetch(`${API_URL}/ads/${id}`, { method: "DELETE" });
};
