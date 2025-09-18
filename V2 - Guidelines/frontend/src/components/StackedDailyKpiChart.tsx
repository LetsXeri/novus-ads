import { useEffect, useMemo, useState } from "react";
import { fetchDailyKpis, DailyKpiRow } from "../api/analytics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import "./StackedDailyKpiChart.css";

type Props = {
	from?: string; // yyyy-mm-dd
	to?: string; // yyyy-mm-dd
	metric?: "earnings" | "calls"; // default: earnings
};

function toDisplayDate(iso: string) {
	// "2025-09-17" -> "17.09."
	const d = new Date(iso + "T00:00:00");
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	return `${dd}.${mm}.`;
}
const fmtEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const fmtEUR2 = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const fmtInt = new Intl.NumberFormat("de-DE", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const COLORS = [
	"#2563EB",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#8B5CF6",
	"#14B8A6",
	"#EAB308",
	"#F97316",
	"#06B6D4",
	"#84CC16",
];

function CustomTooltip({ active, payload, label, metric }: any) {
	if (!active || !payload?.length) return null;

	const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);

	const fmtEUR2 = new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	const fmtInt = new Intl.NumberFormat("de-DE", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

	return (
		<div className="chart-tooltip">
			<div className="chart-tooltip-date">{label}</div>
			<div className="chart-tooltip-total">
				Gesamt: {metric === "earnings" ? fmtEUR2.format(total) : fmtInt.format(total)}
			</div>
			<div className="chart-tooltip-items">
				{payload.map((p: any, i: number) => (
					<div key={i} className="chart-tooltip-row">
						<span className="dot" style={{ background: p.color }} />
						<span className="name">{p.name}</span>
						<span className="value">
							{metric === "earnings" ? fmtEUR2.format(p.value) : fmtInt.format(p.value ?? 0)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function StackedDailyKpiChart({ from, to, metric = "earnings" }: Props) {
	const [rows, setRows] = useState<DailyKpiRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const data = await fetchDailyKpis({ from, to });
				if (mounted) setRows(data);
			} catch (e: any) {
				if (mounted) setError(e?.message ?? "Fehler beim Laden");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [from, to]);

	const placementNames = useMemo(() => {
		const set = new Set<string>();
		rows.forEach((r) => set.add(r.placementName));
		return Array.from(set).sort();
	}, [rows]);

	// Recharts Datenstruktur: [{date, [placementName]: value}]
	const chartData = useMemo(() => {
		const byDate = new Map<string, Record<string, any>>();
		for (const r of rows) {
			const key = r.date;
			if (!byDate.has(key)) byDate.set(key, { date: toDisplayDate(key), _iso: key });
			const obj = byDate.get(key)!;
			obj[r.placementName] = (obj[r.placementName] ?? 0) + (metric === "earnings" ? r.earnings : r.calls);
		}
		return Array.from(byDate.values()).sort((a, b) => (a._iso > b._iso ? 1 : -1));
	}, [rows, metric]);

	if (loading) return <p className="chart-muted">Diagramm wird geladen …</p>;
	if (error) return <p className="chart-error">{error}</p>;
	if (chartData.length === 0) return <p className="chart-muted">Keine Daten im Zeitraum.</p>;

	return (
		<div className="chart-card">
			<div className="chart-header">
				<h3>Performance nach Tag und Placement</h3>
				<span className="chart-meta">{metric === "earnings" ? "Einnahmen (€)" : "Aufrufe"}</span>
			</div>

			<ResponsiveContainer width="100%" height={320}>
				<BarChart data={chartData} barGap={2}>
					<defs>
						{placementNames.map((name, idx) => (
							<linearGradient key={name} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.9} />
								<stop offset="100%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.6} />
							</linearGradient>
						))}
					</defs>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis dataKey="date" tickMargin={8} />
					<YAxis
						tickFormatter={(v) => (metric === "earnings" ? fmtEUR2.format(v) : fmtInt.format(v))}
						width={80}
						domain={[0, "auto"]}
						allowDecimals={false}
					/>

					<Tooltip content={<CustomTooltip metric={metric} />} />
					<Legend wrapperStyle={{ paddingTop: 8 }} />
					{placementNames.map((name, idx) => (
						<Bar key={name} dataKey={name} stackId="kpi" fill={`url(#grad-${idx})`} radius={[4, 4, 0, 0]} />
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
