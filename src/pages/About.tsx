import { useNavigate } from "react-router-dom";
import { StarPanel, NebulaBg } from "../Portfolio";

export default function About() {
  const navigate = useNavigate();
  return (
    <>
      <NebulaBg fixed />
      <StarPanel initialTab="about" onClose={() => navigate("/")} standalone />
    </>
  );
}
