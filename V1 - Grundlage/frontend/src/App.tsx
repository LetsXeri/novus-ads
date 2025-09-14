// src/App.tsx
import Sidebar from "./components/Sidebar";
import { Outlet } from "react-router-dom";
import "./App.css";

function App() {
	return (
		<div className="app-layout">
			<Sidebar />
			<main className="app-main">
				<div className="main-content">
					<Outlet />
				</div>
			</main>
		</div>
	);
}

export default App;
