import { useEffect, useMemo, useState } from "react";
import { Ad } from "../types/ad";
import { useAds } from "../hooks/useAds";
import { Placement } from "../types/placement";
import "./Ads.css";
import { API_URL } from "../config";

type SortKey = "url" | "remaining" | "spent" | "createdAt";

const formatDate = (iso?: string) => {
	if (!iso) return "-";
	const d = new Date(iso);
	if (isNaN(d.getTime())) return iso;
	return d.toLocaleDateString();
};

const calcSpent = (ad: Ad) => {
	if (ad.initialBudget == null || ad.budget == null) return 0;
	const spent = ad.initialBudget - ad.budget;
	return spent >= 0 ? spent : 0;
};

const Ads = () => {
	const { ads, reload, createAd, updateAd, deleteAd } = useAds();
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	// --- Sort & Filter state ---
	const [sortKey, setSortKey] = useState<SortKey>("createdAt");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [showEmptyBudgetOnly, setShowEmptyBudgetOnly] = useState(false);
	const [threshold, setThreshold] = useState<number>(0);

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
				const res = await fetch(`${API_URL}/placements`);
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

	// --- Sort & Filter anwenden ---
	const filteredAndSortedAds = useMemo(() => {
		const filtered = ads.filter((a) => {
			if (!showEmptyBudgetOnly) return true;
			const remaining = a.budget ?? 0;
			return remaining <= threshold;
		});

		const sorted = [...filtered].sort((a, b) => {
			let av: string | number = 0;
			let bv: string | number = 0;

			switch (sortKey) {
				case "url":
					av = a.url.toLowerCase();
					bv = b.url.toLowerCase();
					break;
				case "remaining":
					av = a.budget ?? 0;
					bv = b.budget ?? 0;
					break;
				case "spent":
					av = calcSpent(a);
					bv = calcSpent(b);
					break;
				case "createdAt":
					av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					break;
			}

			if (av < bv) return sortDir === "asc" ? -1 : 1;
			if (av > bv) return sortDir === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	}, [ads, sortKey, sortDir, showEmptyBudgetOnly, threshold]);

	const resetFilters = () => {
		setShowEmptyBudgetOnly(false);
		setThreshold(0);
		setSortKey("createdAt");
		setSortDir("desc");
	};

	const setThresholdQuick = (val: number) => {
		setThreshold(val);
		if (!showEmptyBudgetOnly) setShowEmptyBudgetOnly(true);
	};

	return (
		<div className="ads-wrapper">
			<h1 className="ads-title">Ads verwalten</h1>

			{/* Toolbar: Filter & Sortierung – hübsch, zugänglich, ohne externe Libs */}
			<div className="ads-toolbar">
				<div className="toolbar-left">
					<button className="btn-primary" onClick={openModal}>
						Neue Ad
					</button>
				</div>

				<div className="toolbar-right">
					{/* Budget leer Filter */}
					<div className="filter-card">
						<div className="filter-row">
							<label className="switch">
								<input
									type="checkbox"
									checked={showEmptyBudgetOnly}
									onChange={(e) => setShowEmptyBudgetOnly(e.target.checked)}
									aria-label="Nur Ads mit leerem/geringem Budget anzeigen"
								/>
								<span className="slider" />
							</label>
							<span className="filter-label">Budget leer</span>
						</div>

						<div className="filter-row">
							<span className="muted">Schwellwert ≤</span>
							<input
								className="input"
								type="number"
								min={0}
								step={0.01}
								value={threshold}
								onChange={(e) => setThreshold(Number(e.target.value))}
								title="Schwellwert für 'Budget leer'"
							/>
							<div className="chips">
								<button
									className={`chip ${threshold === 0 ? "active" : ""}`}
									onClick={() => setThresholdQuick(0)}
									type="button"
								>
									0
								</button>
								<button
									className={`chip ${threshold === 1 ? "active" : ""}`}
									onClick={() => setThresholdQuick(1)}
									type="button"
								>
									1
								</button>
								<button
									className={`chip ${threshold === 5 ? "active" : ""}`}
									onClick={() => setThresholdQuick(5)}
									type="button"
								>
									5
								</button>
							</div>
						</div>
					</div>

					{/* Sortieren */}
					<div className="filter-card">
						<div className="filter-row">
							<span className="filter-label">Sortieren nach</span>
							<select
								className="select"
								value={sortKey}
								onChange={(e) => setSortKey(e.target.value as SortKey)}
								aria-label="Sortierfeld auswählen"
							>
								<option value="createdAt">Erstellt am</option>
								<option value="url">URL</option>
								<option value="remaining">Restbudget</option>
								<option value="spent">Ausgaben</option>
							</select>

							<button
								type="button"
								className="btn-ghost"
								onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
								aria-label={`Sortierreihenfolge umschalten (aktuell ${
									sortDir === "asc" ? "aufsteigend" : "absteigend"
								})`}
								title={sortDir === "asc" ? "Aufsteigend" : "Absteigend"}
							>
								{sortDir === "asc" ? "▲" : "▼"}
							</button>
						</div>

						<div className="filter-row">
							<button type="button" className="btn-secondary" onClick={resetFilters}>
								Zurücksetzen
							</button>
						</div>
					</div>
				</div>
			</div>

			<table className="ad-table">
				<thead>
					<tr>
						<th>URL</th>
						<th>Gewicht</th>
						<th>Limit</th>
						<th>Aufrufe</th>
						<th>Restbudget</th>
						<th>Ausgaben</th>
						<th>Erstellt am</th>
						<th>Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{filteredAndSortedAds.map((a) => {
						const remaining = a.budget ?? 0;
						const spent = a.initialBudget != null && a.budget != null ? a.initialBudget - a.budget : null;
						const isEmpty = showEmptyBudgetOnly ? remaining <= threshold : remaining === 0;

						return (
							<tr key={a.id} className={isEmpty ? "row-empty" : ""}>
								<td className="url-cell">
									<a href={a.url} target="_blank" rel="noreferrer" className="url-link">
										{a.url}
									</a>
								</td>
								<td>{a.weight}</td>
								<td>{a.limit ?? "∞"}</td>
								<td>{a.calls}</td>
								<td>
									{a.budget != null ? (
										<>
											{a.budget.toFixed(2)} {a.budget <= (threshold || 0) && <span className="badge danger">leer</span>}
										</>
									) : (
										"—"
									)}
								</td>
								<td>{spent != null ? spent.toFixed(2) : "—"}</td>
								<td>{formatDate(a.createdAt)}</td>
								<td>
									<button className="table-action" onClick={() => handleEdit(a)} title="Bearbeiten">
										✏️
									</button>
									<button className="table-action" onClick={() => handleDelete(a.id)} title="Löschen">
										🗑️
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{/* Modal */}
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
