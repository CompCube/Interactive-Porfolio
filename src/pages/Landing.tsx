import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  STAR,
  TK,
  NebulaBg,
  SecReveal,
  SecTitle,
  FeaturedCarousel,
  TechGrid,
  ExperienceGrid,
  renderBold,
} from "../Portfolio";

// Static-first landing at "/". No 3D, no Three.js — that lives at /explore.
// This page is the fast path for a recruiter with 30 seconds.
export default function Landing() {
  const navigate = useNavigate();
  const c = STAR.hex;
  const enteredRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (enteredRef.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && window.scrollY > 0) {
        enteredRef.current = true;
        navigate("/explore");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [navigate]);

  const pillars = [
    {
      icon: "✦",
      title: "Intelligent Systems",
      text: "Design and build end-to-end tools, agents, and workflows powered by Generative AI.",
    },
    {
      icon: "✦",
      title: "Game Development",
      text: "Design and build games, from gameplay systems and mechanics to complete interactive experiences, with a strong focus on environment art, game design and player experience.",
    },
    {
      icon: "✦",
      title: "Technical Art",
      text: "Bridge art and engineering with custom tools, shaders, and real-time production pipelines.",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#000008",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <style>{`@keyframes introUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}@keyframes introIn{from{opacity:0}to{opacity:1}}@keyframes introBlink{0%,100%{opacity:.14}50%{opacity:.44}}`}</style>
      <NebulaBg fixed />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 clamp(1.3rem,4vw,2.5rem) 3.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(3rem,8vh,5rem)",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "clamp(2rem,5vh,3.5rem)",
            paddingTop: "clamp(3.5rem,7vh,5rem)",
            paddingBottom: "clamp(1.5rem,4vh,3rem)",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "clamp(2rem,5vh,3.5rem)",
            }}
          >
            <div
              className="hero-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px,250px) 1fr",
                gap: "clamp(1.8rem,4vw,3rem)",
                alignItems: "center",
                maxWidth: 940,
                margin: "0 auto",
                width: "100%",
              }}
            >
              <div className="hero-photo" style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: "-18%",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse,${c}22 0%,transparent 68%)`,
                    filter: "blur(6px)",
                    pointerEvents: "none",
                    animation: "introIn 1.2s both",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1/1",
                    borderRadius: "28px",
                    overflow: "hidden",
                    border: `2px solid ${c}55`,
                    boxShadow: `0 0 80px ${c}28,inset 0 0 40px rgba(0,0,0,.3)`,
                    background: `radial-gradient(ellipse at 50% 30%,${c}14,#0a0a12)`,
                    animation: "introIn .8s both",
                  }}
                >
                  <img
                    src="https://raw.githubusercontent.com/CompCube/Interactive-Porfolio/main/portfolio-media/profile_picture.png"
                    alt="Jordi Altisèn"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
              <div className="hero-text" style={{ opacity: 1 }}>
                <div
                  style={{
                    fontSize: ".64rem",
                    color: `${c}88`,
                    fontFamily: "'JetBrains Mono',monospace",
                    letterSpacing: ".32em",
                    marginBottom: "1rem",
                    animation: "introIn .8s .1s both",
                  }}
                >
                  PORTFOLIO 2026
                </div>
                <h1
                  style={{
                    fontSize: "clamp(1.7rem,3.4vw,2.5rem)",
                    fontWeight: 700,
                    color: "rgba(255,248,240,.96)",
                    lineHeight: 1.2,
                    margin: "0 0 1.1rem",
                  }}
                >
                  {["Hi,", "I'm"].map((w, i) => (
                    <span
                      key={i}
                      className="word"
                      style={{ animationDelay: `${0.15 + i * 0.08}s`, marginRight: ".32em" }}
                    >
                      {w}
                    </span>
                  ))}
                  <span
                    className="word"
                    style={{ animationDelay: ".31s", color: c, textShadow: `0 0 28px ${c}66` }}
                  >
                    Jordi.
                  </span>
                  <br />
                  {["Welcome", "to", "my", "portfolio!"].map((w, i) => (
                    <span
                      key={i}
                      className="word"
                      style={{ animationDelay: `${0.42 + i * 0.07}s`, marginRight: ".32em" }}
                    >
                      {w}
                    </span>
                  ))}
                </h1>
                <p
                  style={{
                    fontSize: "clamp(.85rem,1.3vw,.95rem)",
                    color: "rgba(232,232,240,.62)",
                    lineHeight: 1.7,
                    maxWidth: 520,
                    margin: "0 0 1.8rem",
                    animation: "introIn .8s .3s both",
                  }}
                >
                  Game Developer focused on Technical Art, with a passion for building
                  AI-powered systems and interactive experiences.
                </p>
                <div
                  className="hero-ctas"
                  style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", animation: "introIn .8s .45s both" }}
                >
                  <button
                    onClick={() => navigate("/explore")}
                    style={{
                      padding: ".78rem 1.6rem",
                      background: c,
                      border: "none",
                      borderRadius: "9px",
                      color: "#0a0a12",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk',sans-serif",
                      boxShadow: `0 0 30px ${c}33`,
                    }}
                  >
                    Explore Portfolio
                  </button>
                  <button
                    onClick={() => navigate("/contact")}
                    style={{
                      padding: ".78rem 1.6rem",
                      background: "rgba(255,255,255,.06)",
                      border: "1px solid rgba(255,255,255,.18)",
                      borderRadius: "9px",
                      color: "#e8e8f0",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      fontWeight: 600,
                      fontFamily: "'Space Grotesk',sans-serif",
                    }}
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
            <div style={{ animation: "introIn 1s .5s both" }}>
              <div
                style={{
                  fontSize: ".64rem",
                  color: "rgba(232,232,240,.4)",
                  fontFamily: "'JetBrains Mono',monospace",
                  letterSpacing: ".32em",
                  textAlign: "center",
                  marginBottom: "1.4rem",
                }}
              >
                WHAT I DO
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "1rem",
                }}
              >
                {pillars.map((pl) => (
                  <div
                    key={pl.title}
                    style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.09)",
                      borderRadius: "14px",
                      padding: "1.3rem 1.4rem",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.5rem",
                        color: c,
                        marginBottom: ".6rem",
                        textShadow: `0 0 16px ${c}44`,
                      }}
                    >
                      {pl.icon}
                    </div>
                    <div style={{ fontSize: ".92rem", fontWeight: 700, color: "#e8e8f0", marginBottom: ".45rem" }}>
                      {pl.title}
                    </div>
                    <div style={{ fontSize: ".76rem", color: "rgba(232,232,240,.5)", lineHeight: 1.6 }}>
                      {pl.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SecReveal>
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "minmax(260px,.85fr) 1.15fr",
              gap: "clamp(3.5rem,8vw,7rem)",
              alignItems: "center",
              padding: "3rem 0",
            }}
            className="feat-grid"
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: "#e8e8f0", margin: "0 0 1rem", lineHeight: 1.2 }}>
                Featured <span style={{ color: c }}>projects</span>
              </h2>
              <p style={{ fontSize: ".88rem", color: TK.tx.mid, lineHeight: 1.75, margin: "0 0 1.8rem", maxWidth: 420 }}>
                A selection of the projects that best represent my work across game
                development, technical art and intelligent systems.
              </p>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/explore")}
                  className="pf-btn"
                  style={{
                    padding: ".75rem 1.5rem",
                    background: c,
                    border: "none",
                    borderRadius: "100px",
                    color: "#0a0a12",
                    cursor: "pointer",
                    fontSize: ".82rem",
                    fontWeight: 700,
                    fontFamily: TK.sans,
                    boxShadow: `0 0 30px ${c}33`,
                  }}
                >
                  Explore Portfolio
                </button>
                <button
                  onClick={() => navigate("/work")}
                  className="pf-btn"
                  style={{
                    padding: ".75rem 1.5rem",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.2)",
                    borderRadius: "100px",
                    color: "#e8e8f0",
                    cursor: "pointer",
                    fontSize: ".82rem",
                    fontWeight: 600,
                    fontFamily: TK.sans,
                  }}
                >
                  View all projects
                </button>
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <FeaturedCarousel onOpen={(m: { id: string }) => navigate(`/work/${m.id}`)} />
            </div>
          </div>
        </SecReveal>

        <SecReveal>
          <div style={{ position: "relative", padding: "2rem 0" }}>
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                gap: "1rem",
                maxWidth: 940,
                margin: "0 auto",
                width: "100%",
              }}
            >
              {[
                ["140+", "Production assets"],
                ["3+", "Years in game dev"],
                ["3,000+", "Hours in Blender"],
                ["High Honors", "Final degree project"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  style={{
                    textAlign: "center",
                    padding: "1rem .6rem",
                    background: "rgba(255,255,255,.025)",
                    border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: TK.r.md,
                  }}
                >
                  <div style={{ fontSize: "clamp(1.1rem,2.2vw,1.5rem)", fontWeight: 700, color: c, marginBottom: ".25rem", textShadow: `0 0 20px ${c}44` }}>
                    {n}
                  </div>
                  <div style={{ fontSize: ".64rem", color: TK.tx.lo, fontFamily: TK.mono, letterSpacing: ".1em", lineHeight: 1.4 }}>
                    {l.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SecReveal>

        <SecReveal>
          <div style={{ position: "relative", padding: "2.5rem 0" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <SecTitle t="ABOUT ME" c={c} />
              <p style={{ fontSize: ".88rem", lineHeight: 1.8, color: "rgba(232,232,240,.62)", whiteSpace: "pre-line", maxWidth: 820, margin: "0 auto" }}>
                {renderBold(STAR.summary)}
              </p>
            </div>
          </div>
        </SecReveal>

        <SecReveal>
          <div style={{ position: "relative", padding: "2.5rem 0" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <SecTitle t="SKILLS" c={c} />
              <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <TechGrid compact />
              </div>
            </div>
          </div>
        </SecReveal>

        <SecReveal>
          <div style={{ position: "relative", padding: "2.5rem 0" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <SecTitle t="EXPERIENCE & EDUCATION" c={c} />
              <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <ExperienceGrid c={c} />
              </div>
            </div>
          </div>
        </SecReveal>

        <div onClick={() => navigate("/explore")} style={{ textAlign: "center", cursor: "pointer", paddingTop: "2rem" }}>
          <div style={{ width: 1, height: "clamp(40px,9vh,90px)", margin: "0 auto 1.2rem", background: `linear-gradient(180deg,transparent,${c}66)` }} />
          <div style={{ fontSize: ".62rem", color: `${c}88`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".26em", marginBottom: ".6rem" }}>
            ENTER THE INTERACTIVE PORTFOLIO
          </div>
          <div style={{ fontSize: "1.2rem", color: `${c}77`, animation: "introBlink 2.4s infinite" }}>↓</div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 30%,transparent 45%,rgba(0,0,8,.6) 100%)" }} />
    </div>
  );
}
