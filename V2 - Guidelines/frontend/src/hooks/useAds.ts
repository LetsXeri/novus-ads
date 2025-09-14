import { useEffect, useState } from "react";
import { Ad } from "../types/ad";
import { getAds, createAd, updateAd, deleteAd } from "../api/ads";

/**
 * Custom Hook für Ads (vormals Targets).
 * Lädt Ads vom Backend und stellt CRUD-Operationen bereit.
 */
export const useAds = () => {
	const [ads, setAds] = useState<Ad[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			const data = await getAds();
			setAds(data);
		} catch (e: any) {
			setError(e.message || "Fehler beim Laden der Ads");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return {
		ads,
		setAds,
		loading,
		error,
		reload: load,
		createAd,
		updateAd,
		deleteAd,
	};
};
