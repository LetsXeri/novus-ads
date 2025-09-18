import { useMemo, useState } from "react";
import StackedDailyKpiChart from "../components/StackedDailyKpiChart";
import { fetchDailyKpis, DailyKpiRow } from "../api/analytics";
import "./Dashboard.css";
import { useEffect } from "react";

function formatISO(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function lastNDaysRange(n: number): { from: string; to: string } {
	const to = new Date();
	const from = new Date();
	from.setDate(to.getDate() - (n - 1));
	return { from: formatISO(from), to: formatISO(to) };
}
const fmtEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export default function Dashboard() {
	const initial = useMemo(() => lastNDaysRange(14), []);
	const [from, setFrom] = useState(initial.from);
	const [to, setTo] = useState(initial.to);
	const [metric, setMetric] = useState<"earnings" | "calls">("earnings");

	// kleine KPI-Tiles: Summen aus den Daily-Data
	const [daily, setDaily] = useState<DailyKpiRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				setErr(null);
				const data = await fetchDailyKpis({ from, to });
				if (mounted) setDaily(data);
			} catch (e: any) {
				if (mounted) setErr(e?.message ?? "Fehler beim Laden");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [from, to]);

	const kpis = useMemo(() => {
		const earnings = daily.reduce((s, r) => s + (r.earnings || 0), 0);
		const calls = daily.reduce((s, r) => s + (r.calls || 0), 0);
		// Tage im Zeitraum
		const uniqueDays = new Set(daily.map((d) => d.date)).size || 1;
		const avgEarningsPerDay = earnings / uniqueDays;
		const avgCallsPerDay = calls / uniqueDays;
		return {
			earnings,
			calls,
			avgEarningsPerDay,
			avgCallsPerDay,
		};
	}, [daily]);

	return (
		<div className="dash-wrapper">
			<header className="dash-header">
				<div className="dash-title-group">
					<h1 className="dash-title">Dashboard</h1>
					<p className="dash-subtitle">Überblick über tägliche Performance nach Placement</p>
				</div>

				<div className="dash-controls">
					<div className="control">
						<label>Von</label>
						<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
					</div>
					<div className="control">
						<label>Bis</label>
						<input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
					</div>
					<div className="control">
						<label>KPI</label>
						<select value={metric} onChange={(e) => setMetric(e.target.value as any)}>
							<option value="earnings">Einnahmen</option>
							<option value="calls">Aufrufe</option>
						</select>
					</div>
				</div>
			</header>

			<section className="kpi-grid">
				<div className="kpi-card">
					<div className="kpi-label">Gesamt-Einnahmen</div>
					<div className="kpi-value">{fmtEUR.format(kpis.earnings)}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Gesamt-Aufrufe</div>
					<div className="kpi-value">{kpis.calls.toLocaleString("de-DE")}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Ø Einnahmen/Tag</div>
					<div className="kpi-value">{fmtEUR.format(kpis.avgEarningsPerDay)}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Ø Aufrufe/Tag</div>
					<div className="kpi-value">{Math.round(kpis.avgCallsPerDay).toLocaleString("de-DE")}</div>
				</div>
			</section>

			<section className="chart-section">
				<StackedDailyKpiChart from={from} to={to} metric={metric} />
			</section>

			{loading && <p className="muted">Lade Daten…</p>}
			{err && <p className="error">{err}</p>}
		</div>
	);
}
