import { useNavigate } from "react-router-dom";
import { StarPanel, NebulaBg } from "../Portfolio";

export default function Contact() {
  const navigate = useNavigate();
  return (
    <>
      <NebulaBg fixed />
      <StarPanel initialTab="contact" onClose={() => navigate("/")} standalone />
    </>
  );
}
