import { useNavigate } from "react-router-dom";
import { StarPanel } from "../Portfolio";

export default function About() {
  const navigate = useNavigate();
  return <StarPanel initialTab="about" onClose={() => navigate("/")} />;
}
