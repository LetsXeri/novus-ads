import { useEffect, useState } from "react";
import { TargetType } from "../types/target";
import { useTargets } from "../hooks/useTargets";
import { CampaignType } from "../types/campaign";
import "./Targets.css";

const Targets = () => {
	const { targets, reload, createTarget, updateTarget, deleteTarget } = useTargets();
	const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	const [formData, setFormData] = useState<{
		url: string;
		weight: number;
		limit: number | null;
		budget: number | null;
		campaignId: number | null;
	}>({
		url: "",
		weight: 100,
		limit: null,
		budget: null,
		campaignId: null,
	});

	useEffect(() => {
		const fetchCampaigns = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/campaigns`);
				const data = await res.json();
				setCampaigns(data);
			} catch (err) {
				console.error("Fehler beim Laden der Kampagnen", err);
			}
		};
		fetchCampaigns();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: name === "limit" || name === "weight" || name === "budget" ? Number(value) || null : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingId) {
			await updateTarget(editingId, formData);
		} else {
			await createTarget(formData);
		}
		reload();
		closeModal();
	};

	const handleEdit = (target: TargetType) => {
		setEditingId(target.id);
		setFormData({
			url: target.url,
			weight: target.weight,
			limit: target.limit,
			budget: target.budget,
			campaignId: target.campaignId,
		});
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		await deleteTarget(id);
		reload();
	};

	const openModal = () => {
		setEditingId(null);
		setFormData({ url: "", weight: 100, limit: null, budget: null, campaignId: null });
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingId(null);
	};

	return (
		<div className="targets-wrapper">
			<h1 className="targets-title">Ad-Links verwalten</h1>
			<button className="new-target-button" onClick={openModal}>
				Neuer Ad-Link
			</button>

			<table className="target-table">
				<thead>
					<tr>
						<th>URL</th>
						<th>Gewicht</th>
						<th>Limit</th>
						<th>Aufrufe</th>
						<th>Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{targets.map((t) => (
						<tr key={t.id}>
							<td>{t.url}</td>
							<td>{t.weight}</td>
							<td>{t.limit ?? "∞"}</td>
							<td>{t.calls}</td>
							<td>
								<button onClick={() => handleEdit(t)}>✏️</button>
								<button onClick={() => handleDelete(t.id)}>🗑️</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{showModal && (
				<div className="modal-backdrop">
					<div className="modal">
						<h2>{editingId ? "Ziel-URL bearbeiten" : "Neue Ziel-URL"}</h2>
						<form className="modal-form" onSubmit={handleSubmit}>
							<label>
								URL:
								<input name="url" value={formData.url} onChange={handleChange} required />
							</label>
							<label>
								Gewichtung:
								<input name="weight" type="number" min={1} value={formData.weight} onChange={handleChange} />
							</label>
							<label>
								Limit:
								<input name="limit" type="number" min={0} value={formData.limit ?? ""} onChange={handleChange} />
							</label>
							<label>
								Budget (optional):
								<input
									name="budget"
									type="number"
									min={0}
									step={0.01}
									value={formData.budget ?? ""}
									onChange={handleChange}
								/>
							</label>
							<label>
								Werbeplatz zuordnen:
								<select name="campaignId" value={formData.campaignId ?? ""} onChange={handleChange}>
									<option value="">Keine</option>
									{campaigns.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</label>
							<div className="modal-actions">
								<button type="button" onClick={closeModal}>
									Abbrechen
								</button>
								<button type="submit">Speichern</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default Targets;
