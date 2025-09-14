import { useEffect, useState } from "react";
import { Ad } from "../types/ad";
import { useAds } from "../hooks/useAds";
import { Placement } from "../types/placement";
import "./Ads.css";

const Ads = () => {
	const { ads, reload, createAd, updateAd, deleteAd } = useAds();
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	const [formData, setFormData] = useState<{
		url: string;
		weight: number;
		limit: number | null;
		budget: number | null;
		placementId: number | null;
	}>({
		url: "",
		weight: 100,
		limit: null,
		budget: null,
		placementId: null,
	});

	useEffect(() => {
		const fetchPlacements = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/placements`);
				const data = await res.json();
				setPlacements(data);
			} catch (err) {
				console.error("Fehler beim Laden der Placements", err);
			}
		};
		fetchPlacements();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				name === "limit" || name === "weight" || name === "budget"
					? value === ""
						? null
						: Number(value)
					: name === "placementId"
					? value === ""
						? null
						: Number(value)
					: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingId) {
			await updateAd(editingId, formData);
		} else {
			await createAd(formData);
		}
		reload();
		closeModal();
	};

	const handleEdit = (ad: Ad) => {
		setEditingId(ad.id);
		setFormData({
			url: ad.url,
			weight: ad.weight,
			limit: ad.limit,
			budget: ad.budget,
			placementId: ad.placementId,
		});
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		await deleteAd(id);
		reload();
	};

	const openModal = () => {
		setEditingId(null);
		setFormData({ url: "", weight: 100, limit: null, budget: null, placementId: null });
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingId(null);
	};

	return (
		<div className="ads-wrapper">
			<h1 className="ads-title">Ads verwalten</h1>

			<button className="new-ad-button" onClick={openModal}>
				Neue Ad
			</button>

			<table className="ad-table">
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
					{ads.map((a) => (
						<tr key={a.id}>
							<td>{a.url}</td>
							<td>{a.weight}</td>
							<td>{a.limit ?? "∞"}</td>
							<td>{a.calls}</td>
							<td>
								<button onClick={() => handleEdit(a)}>✏️</button>
								<button onClick={() => handleDelete(a.id)}>🗑️</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{showModal && (
				<div className="modal-backdrop">
					<div className="modal">
						<h2>{editingId ? "Ad bearbeiten" : "Neue Ad"}</h2>
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
								Placement zuordnen:
								<select name="placementId" value={formData.placementId ?? ""} onChange={handleChange}>
									<option value="">Keine</option>
									{placements.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
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

export default Ads;
