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

	const handleEdit = (id: number) => {
		const campaign = campaigns.find((c) => c.id === id);
		if (campaign) setEditing(campaign);
	};

	const reload = () => {
		window.location.reload(); // oder per Hook neu laden
	};

	const handleDelete = (id: number) => {
		console.log("Delete", id);
	};

	return (
		<div className="campaigns-wrapper">
			<div className="campaigns-header">
				<h1 className="campaigns-title">Werbeplätze</h1>
				<NewCampaignButton />
			</div>

			{loading && <p>Lade Kampagnen...</p>}
			{error && <p style={{ color: "red" }}>{error}</p>}

			<div className="campaigns-grid">
				{campaigns.map((c) => (
					<CampaignCard key={c.id} campaign={c} onEdit={handleEdit} onDelete={handleDelete} />
				))}
			</div>

			{editing && <EditCampaignModal campaign={editing} onClose={() => setEditing(null)} onSave={reload} />}
		</div>
	);
};

export default Campaigns;
