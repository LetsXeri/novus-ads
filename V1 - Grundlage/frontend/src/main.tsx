import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Targets from "./pages/Targets";

// Hier mounten wir alles ins <div id="root"></div> in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route index element={<Dashboard />} />
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="campaigns" element={<Campaigns />} />
					<Route path="targets" element={<Targets />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
