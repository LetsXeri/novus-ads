import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import Placements from "./pages/Placements";
import Ads from "./pages/Ads";

// Hier mounten wir alles ins <div id="root"></div> in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route index element={<Dashboard />} />
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="placements" element={<Placements />} />
					<Route path="ads" element={<Ads />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
