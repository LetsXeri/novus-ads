import "./Campaigns.css";
import { useState } from "react";

import { useCampaigns } from "../hooks/useCampaigns";
import { CampaignType } from "../types/campaign";
import CampaignCard from "../components/CampaignCard";
import NewCampaignButton from "../components/NewCampaignButton";
import EditCampaignModal from "../components/EditCampaignModal";

const Campaigns = () => {
	const { campaigns, loading, error } = useCampaigns();
	const [editing, setEditing] = useState<CampaignType | null>(null);
	const [creating, setCreating] = useState<boolean>(false);

	const handleEdit = (id: number) => {
		const campaign = campaigns.find((c) => c.id === id);
		if (campaign) setEditing(campaign);
	};

	const reload = () => {
		window.location.reload(); // oder per Hook neu laden
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Möchtest du diese Kampagne wirklich löschen?")) return;

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/campaigns/${id}`, {
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
		<div className="campaigns-wrapper">
			<div className="campaigns-header">
				<h1 className="campaigns-title">Werbeplätze</h1>
				<NewCampaignButton onClick={() => setCreating(true)} />
			</div>

			{loading && <p>Lade Kampagnen...</p>}
			{error && <p style={{ color: "red" }}>{error}</p>}

			<div className="campaigns-grid">
				{campaigns.map((c) => (
					<CampaignCard key={c.id} campaign={c} onEdit={handleEdit} onDelete={handleDelete} />
				))}
			</div>

			{editing && <EditCampaignModal campaign={editing} onClose={() => setEditing(null)} onSave={reload} />}

			{creating && (
				<EditCampaignModal
					campaign={{ id: 0, name: "", status: "Aktiv", targets: [] }}
					onClose={() => setCreating(false)}
					onSave={reload}
				/>
			)}
		</div>
	);
};

export default Campaigns;
