import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.2rem",
        background: "#000008",
        color: "#e8e8f0",
        fontFamily: "'Space Grotesk', sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          fontSize: "5rem",
          fontWeight: 700,
          color: "#EDC32B",
          lineHeight: 1,
        }}
      >
        404
      </div>
      <p style={{ fontSize: "1rem", color: "rgba(232,232,240,.7)", maxWidth: 420 }}>
        This page doesn't exist. It might have drifted out of orbit.
      </p>
      <Link
        to="/"
        style={{
          marginTop: ".5rem",
          padding: ".78rem 1.6rem",
          background: "#EDC32B",
          borderRadius: "9px",
          color: "#0a0a12",
          fontWeight: 700,
          fontSize: ".85rem",
          textDecoration: "none",
        }}
      >
        Back home
      </Link>
    </div>
  );
}
