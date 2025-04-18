import { Plus } from "lucide-react";
import "./NewCampaignButton.css";

type Props = {
	onClick: () => void;
};

const NewCampaignButton = ({ onClick }: Props) => {
	return (
		<button className="new-campaign-button" onClick={onClick}>
			<Plus size={18} />
			Neue Kampagne
		</button>
	);
};

export default NewCampaignButton;
