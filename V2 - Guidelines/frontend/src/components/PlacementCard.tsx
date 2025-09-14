// /frontend/src/components/PlacementCard.tsx
import { Pencil, Trash2 } from "lucide-react";
import { Placement, PlacementEarningsEntry } from "../types/placement";
import "./PlacementCard.css";
import { useEffect, useState } from "react";
import { getPlacementEarnings } from "../api/placements";

const API_URL = import.meta.env.VITE_API_URL;

type Props = {
	placement: Placement;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
};

const PlacementCard = ({ placement, onEdit, onDelete }: Props) => {
	const statusClass = {
		Aktiv: "status-badge status-aktiv",
		Pausiert: "status-badge status-pausiert",
		Beendet: "status-badge status-beendet",
	}[placement.status];

	const [earnings, setEarnings] = useState<PlacementEarningsEntry[]>([]);

	useEffect(() => {
		const loadEarnings = async () => {
			const data = await getPlacementEarnings(placement.id);
			setEarnings(data);
		};
		loadEarnings();
	}, [placement.id]);

	return (
		<div className="placement-card">
			<div className="placement-header">
				<div>
					<h3 className="placement-title">{placement.name}</h3>

					{/* Redirect-URL für diese Werbefläche (Placement) */}
					<input type="text" value={`${API_URL}/placements/${placement.id}/redirect`} readOnly />

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
								{earnings.map((entry, index) => (
									<tr key={index}>
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

				<div className="placement-actions">
					<button onClick={() => onEdit(placement.id)} className="edit-button" title="Bearbeiten">
						<Pencil size={18} />
					</button>
					<button onClick={() => onDelete(placement.id)} className="delete-button" title="Löschen">
						<Trash2 size={18} />
					</button>
				</div>
			</div>

			<span className={statusClass}>{placement.status}</span>
		</div>
	);
};

export default PlacementCard;
