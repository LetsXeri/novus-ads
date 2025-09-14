import { Plus } from "lucide-react";
import "./NewPlacementButton.css";

type Props = {
	onClick: () => void;
};

const NewPlacementButton = ({ onClick }: Props) => {
	return (
		<button className="new-placement-button" onClick={onClick}>
			<Plus size={18} />
			Neues Placement
		</button>
	);
};

export default NewPlacementButton;
