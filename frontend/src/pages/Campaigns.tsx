const Campaigns = () => {
	const campaigns = [
		{ id: 1, name: "Frühjahrskampagne 2025", status: "Aktiv", budget: 5000 },
		{ id: 2, name: "Black Friday", status: "Pausiert", budget: 12000 },
		{ id: 3, name: "Weihnachten 2024", status: "Beendet", budget: 8000 },
	];

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Kampagnen</h1>
			<table className="min-w-full bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
				<thead className="bg-gray-100 text-left">
					<tr>
						<th className="py-3 px-4 font-medium text-sm text-gray-600">Name</th>
						<th className="py-3 px-4 font-medium text-sm text-gray-600">Status</th>
						<th className="py-3 px-4 font-medium text-sm text-gray-600">Budget (€)</th>
					</tr>
				</thead>
				<tbody>
					{campaigns.map((c) => (
						<tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50">
							<td className="py-3 px-4">{c.name}</td>
							<td className="py-3 px-4">
								<span
									className={`px-2 py-1 text-xs rounded-full font-semibold ${
										c.status === "Aktiv"
											? "bg-green-100 text-green-800"
											: c.status === "Pausiert"
											? "bg-yellow-100 text-yellow-800"
											: "bg-gray-200 text-gray-600"
									}`}
								>
									{c.status}
								</span>
							</td>
							<td className="py-3 px-4">{c.budget.toLocaleString("de-DE")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Campaigns;
