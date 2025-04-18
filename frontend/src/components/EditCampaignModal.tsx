import { useEffect, useState } from "react";
import { CampaignType } from "../types/campaign";
import { TargetType } from "../types/target";
import "./EditCampaignModal.css";
const API_URL = import.meta.env.VITE_API_URL;

type Props = {
	campaign: CampaignType;
	onClose: () => void;
	onSave: () => void;
};

const EditCampaignModal = ({ campaign, onClose, onSave }: Props) => {
	const [availableTargets, setAvailableTargets] = useState<TargetType[]>([]);
	const [formData, setFormData] = useState({
		name: campaign.name,
		status: campaign.status,
		targetIds: campaign.targets,
	});

	useEffect(() => {
		const loadTargets = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/targets`);
				const data = await res.json();
				setAvailableTargets(data);
			} catch (err) {
				console.error("Fehler beim Laden der Targets", err);
			}
		};

		loadTargets();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleTargetSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
		setFormData({ ...formData, targetIds: selected });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const isNew = campaign.id === 0;
			const endpoint = isNew
				? `${import.meta.env.VITE_API_URL}/campaigns`
				: `${import.meta.env.VITE_API_URL}/campaigns/${campaign.id}`;
			const method = isNew ? "POST" : "PUT";

			const res = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!res.ok) throw new Error("Fehler beim Speichern");
			onSave();
			onClose();
		} catch (err) {
			alert("Speichern fehlgeschlagen");
			console.error(err);
		}
	};

	return (
		<div className="modal-backdrop">
			<div className="modal">
				<input type="text" value={API_URL + "/campaigns/" + campaign.id + "/redirect"} />
				<h2>Kampagne bearbeiten</h2>
				<form onSubmit={handleSubmit} className="modal-form">
					<label>
						Name:
						<input type="text" name="name" value={formData.name} onChange={handleChange} required />
					</label>
					<label>
						Status:
						<select name="status" value={formData.status} onChange={handleChange}>
							<option value="Aktiv">Aktiv</option>
							<option value="Pausiert">Pausiert</option>
							<option value="Beendet">Beendet</option>
						</select>
					</label>
					<label>
						Ziel-URLs:
						{formData.targetIds?.length}
					</label>
					<div className="modal-actions">
						<button type="button" onClick={onClose}>
							Abbrechen
						</button>
						<button type="submit">Speichern</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditCampaignModal;
