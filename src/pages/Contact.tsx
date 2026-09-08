import { useNavigate } from "react-router-dom";
import { StarPanel } from "../Portfolio";

export default function Contact() {
  const navigate = useNavigate();
  return <StarPanel initialTab="contact" onClose={() => navigate("/")} />;
}
