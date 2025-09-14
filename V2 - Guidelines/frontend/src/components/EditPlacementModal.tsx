import { useEffect, useState } from "react";
import { Placement } from "../types/placement";
import { Ad } from "../types/ad";
import "./EditPlacementModal.css";

const API_URL = import.meta.env.VITE_API_URL;

type Props = {
	placement: Placement;
	onClose: () => void;
	onSave: () => void;
};

const EditPlacementModal = ({ placement, onClose, onSave }: Props) => {
	const [availableAds, setAvailableAds] = useState<Ad[]>([]);
	const [formData, setFormData] = useState<{
		name: string;
		status: Placement["status"];
		adIds: number[]; // vormals targetIds
	}>({
		name: placement.name,
		status: placement.status,
		adIds: placement.ads ?? [],
	});

	useEffect(() => {
		const loadAds = async () => {
			try {
				const res = await fetch(`${API_URL}/ads`);
				const data = (await res.json()) as Ad[];
				setAvailableAds(data);
			} catch (err) {
				console.error("Fehler beim Laden der Ads", err);
			}
		};

		loadAds();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((s) => ({ ...s, [name]: value }));
	};

	const handleAdSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
		setFormData((s) => ({ ...s, adIds: selected }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const isNew = placement.id === 0;
			const endpoint = isNew ? `${API_URL}/placements` : `${API_URL}/placements/${placement.id}`;
			const method = isNew ? "POST" : "PUT";

			// Hinweis: Backend verarbeitet aktuell nur name/status; zusätzliche Felder (adIds) werden ignoriert,
			// bleiben aber im Payload für künftige Erweiterungen.
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
				{/* Redirect-URL für dieses Placement */}
				<input type="text" value={`${API_URL}/placements/${placement.id}/redirect`} readOnly />
				<h2>Placement bearbeiten</h2>

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

					{/* Optional: Auswahl der Ads (vormals Targets). 
              Hier nur als Multi-Select vorbereitet; kann später UI-seitig erweitert werden. */}
					<label>
						Ads (Ziel-URLs) auswählen:
						<select multiple value={formData.adIds.map(String)} onChange={handleAdSelection}>
							{availableAds.map((ad) => (
								<option key={ad.id} value={ad.id}>
									#{ad.id} – {ad.url} (w:{ad.weight})
								</option>
							))}
						</select>
					</label>

					<label>
						Ausgewählte Ads:
						{formData.adIds?.length ?? 0}
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

export default EditPlacementModal;
