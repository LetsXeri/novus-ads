// src/components/CampaignCard.tsx
import { Pencil, Trash2 } from "lucide-react";
import { CampaignEarningsEntry, CampaignType } from "../types/campaign";
import "./CampaignCard.css";
import { useEffect, useState } from "react";
import { getCampaignEarnings } from "../api/campaigns";
const API_URL = import.meta.env.VITE_API_URL;

type Props = {
	campaign: CampaignType;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
};

const CampaignCard = ({ campaign, onEdit, onDelete }: Props) => {
	const statusClass = {
		Aktiv: "status-badge status-aktiv",
		Pausiert: "status-badge status-pausiert",
		Beendet: "status-badge status-beendet",
	}[campaign.status];

	const [earnings, setEarnings] = useState<CampaignEarningsEntry[]>([]);

	useEffect(() => {
		const loadEarnings = async () => {
			const data = await getCampaignEarnings(campaign.id); // z. B. aus Prop oder Context
			setEarnings(data);
		};
		loadEarnings();
	}, [campaign.id]);

	return (
		<div className="campaign-card">
			<div className="campaign-header">
				<div>
					<h3 className="campaign-title">{campaign.name}</h3>
					<input type="text" value={API_URL + "/campaigns/" + campaign.id + "/redirect"} />
					<div className="earnings-section">
						<h3>Einnahmen</h3>
						<table>
							<thead>
								<tr>
									<th>Monat</th>
									<th>Betrag (€)</th>
								</tr>
							</thead>
							<tbody>
								{earnings.map((entry) => (
									<tr key={entry.id}>
										<td>
											{entry.month}.{entry.year}
										</td>
										<td>{entry.amount.toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<div className="campaign-actions">
					<button onClick={() => onEdit(campaign.id)} className="edit-button" title="Bearbeiten">
						<Pencil size={18} />
					</button>
					<button onClick={() => onDelete(campaign.id)} className="delete-button" title="Löschen">
						<Trash2 size={18} />
					</button>
				</div>
			</div>
			<p className="campaign-url">{campaign.url}</p>
			<span className={statusClass}>{campaign.status}</span>
		</div>
	);
};

export default CampaignCard;
