// src/components/NewCampaignButton.tsx
import { Plus } from "lucide-react";
import "./NewCampaignButton.css";

const NewCampaignButton = () => {
	return (
		<button className="new-campaign-button">
			<Plus size={18} />
			Neue Kampagne
		</button>
	);
};

export default NewCampaignButton;
