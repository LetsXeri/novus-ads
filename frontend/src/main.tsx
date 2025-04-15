import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/campaigns" element={<Campaigns />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
