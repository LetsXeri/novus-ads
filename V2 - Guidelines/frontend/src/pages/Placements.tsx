import "./Placements.css";
import { useState } from "react";

import { usePlacements } from "../hooks/usePlacements";
import { Placement } from "../types/placement";
import PlacementCard from "../components/PlacementCard";
import NewPlacementButton from "../components/NewPlacementButton";
import EditPlacementModal from "../components/EditPlacementModal";

const Placements = () => {
	const { placements, loading, error } = usePlacements();
	const [editing, setEditing] = useState<Placement | null>(null);
	const [creating, setCreating] = useState<boolean>(false);

	const handleEdit = (id: number) => {
		const placement = placements.find((p) => p.id === id);
		if (placement) setEditing(placement);
	};

	const reload = () => {
		// Optional: eleganter wäre ein Hook-Refetch; für jetzt pragmatisch
		window.location.reload();
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Möchtest du dieses Placement wirklich löschen?")) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/placements/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) throw new Error("Fehler beim Löschen");
			reload();
		} catch (err) {
			alert("Löschen fehlgeschlagen");
			console.error(err);
		}
	};

	return (
		<div className="placements-wrapper">
			<div className="placements-header">
				<h1 className="placements-title">Placements</h1>
				<NewPlacementButton onClick={() => setCreating(true)} />
			</div>

			{loading && <p>Lade Placements...</p>}
			{error && <p style={{ color: "red" }}>{error}</p>}

			<div className="placements-grid">
				{placements.map((p) => (
					<PlacementCard key={p.id} placement={p} onEdit={handleEdit} onDelete={handleDelete} />
				))}
			</div>

			{editing && <EditPlacementModal placement={editing} onClose={() => setEditing(null)} onSave={reload} />}

			{creating && (
				<EditPlacementModal
					placement={{ id: 0, name: "", status: "Aktiv", ads: [] }}
					onClose={() => setCreating(false)}
					onSave={reload}
				/>
			)}
		</div>
	);
};

export default Placements;
