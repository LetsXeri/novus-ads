import { TargetType } from "../types/target";

const API_URL = import.meta.env.VITE_API_URL;

export const getTargets = async (): Promise<TargetType[]> => {
	const res = await fetch(`${API_URL}/targets`);
	if (!res.ok) throw new Error("Fehler beim Laden der Ziele");
	return res.json();
};

export const createTarget = async (data: Partial<TargetType>) => {
	await fetch(`${API_URL}/targets`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const updateTarget = async (id: number, data: Partial<TargetType>) => {
	console.log(data);
	await fetch(`${API_URL}/targets/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const deleteTarget = async (id: number) => {
	await fetch(`${API_URL}/targets/${id}`, { method: "DELETE" });
};
