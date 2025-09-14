import { LayoutDashboard, FileText, PlusSquare, X, Link as LinkIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
	const [isOpen, setIsOpen] = useState(false);

	const navItemClass = ({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? "active" : ""}`;

	return (
		<>
			{/* Mobile Toggle Button */}
			{!isOpen && (
				<button className="sidebar-toggle" onClick={() => setIsOpen(true)}>
					<span className="sr-only">Menü öffnen</span>
					<svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			)}

			{/* Sidebar */}
			<aside className={`sidebar ${isOpen ? "open" : ""}`}>
				{/* Mobile Schließen-Button */}
				<div className="sidebar-mobile-header">
					<h2>Menü</h2>
					<button onClick={() => setIsOpen(false)} className="close-button">
						<X size={20} />
					</button>
				</div>

				<h2 className="sidebar-title">NovusAds</h2>

				<nav className="sidebar-nav">
					<NavLink to="/dashboard" className={navItemClass}>
						<LayoutDashboard size={18} />
						Dashboard
					</NavLink>

					<NavLink to="/placements" className={navItemClass}>
						<FileText size={18} />
						Placements
					</NavLink>

					<NavLink to="/ads" className={navItemClass}>
						<LinkIcon size={18} />
						Ads
					</NavLink>
				</nav>
			</aside>
		</>
	);
};

export default Sidebar;
