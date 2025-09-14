import { useEffect, useState } from "react";
import { Placement } from "../types/placement";
import { fetchPlacements } from "../api/placements";

/**
 * Custom Hook für Placements (vormals Campaigns).
 * Lädt beim ersten Render die Liste der Placements vom Backend.
 */
export const usePlacements = () => {
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchPlacements();
				setPlacements(data);
			} catch (err: any) {
				setError(err.message || "Unbekannter Fehler");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	return { placements, loading, error };
};
