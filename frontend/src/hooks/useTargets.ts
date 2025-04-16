import { useEffect, useState } from "react";
import { TargetType } from "../types/target";
import { getTargets, createTarget, updateTarget, deleteTarget } from "../api/targets";

export const useTargets = () => {
	const [targets, setTargets] = useState<TargetType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			const data = await getTargets();
			setTargets(data);
		} catch (e: any) {
			setError(e.message || "Fehler beim Laden");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return {
		targets,
		setTargets,
		loading,
		error,
		reload: load,
		createTarget,
		updateTarget,
		deleteTarget,
	};
};
