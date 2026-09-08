import { Navigate } from "react-router-dom";

// Placeholder: the real static-first landing content (hero, stats, about,
// featured projects) still lives inside IntroScreen in Portfolio.tsx. This
// gets extracted into this page in the next step; until then, "/" just
// forwards to the existing experience so no route is dead.
export default function Landing() {
  return <Navigate to="/explore" replace />;
}
