import { useNavigate, useParams, Navigate } from "react-router-dom";
import { CaseStudy, PLANETS } from "../Portfolio";

export default function WorkSlug() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const project = PLANETS.flatMap((p) => p.moons).find((m) => m.id === slug);

  if (!project) return <Navigate to="/work" replace />;

  return <CaseStudy project={project} onClose={() => navigate("/work")} />;
}
