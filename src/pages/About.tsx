import { useNavigate } from "react-router-dom";
import { AboutTab, NebulaBg, Header, STAR } from "../Portfolio";

// Real static-first page, not a modal/popup — matches how Landing renders.
export default function About() {
  const navigate = useNavigate();
  const c = STAR.hex;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#000008",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <NebulaBg fixed />
      <Header
        onHome={() => navigate("/")}
        onAbout={() => {}}
        onProjects={() => navigate("/work")}
        onContact={() => navigate("/contact")}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(6rem,12vh,8rem) clamp(1.3rem,4vw,2.5rem) 4rem",
        }}
      >
        <AboutTab c={c} onContact={() => navigate("/contact")} />
      </div>
    </div>
  );
}
