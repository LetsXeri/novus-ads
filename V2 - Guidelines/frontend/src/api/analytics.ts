export type DailyKpiRow = {
	date: string; // yyyy-mm-dd
	placementId: number;
	placementName: string;
	earnings: number;
	calls: number;
};

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchDailyKpis(params?: { from?: string; to?: string }): Promise<DailyKpiRow[]> {
	const url = new URL(`${API_URL}/analytics/daily`);
	if (params?.from) url.searchParams.set("from", params.from);
	if (params?.to) url.searchParams.set("to", params.to);

	const res = await fetch(url.toString());
	if (!res.ok) {
		throw new Error("Fehler beim Laden der täglichen KPIs");
	}
	return res.json();
}
