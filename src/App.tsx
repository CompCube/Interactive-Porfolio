import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Portfolio, { CSS } from "./Portfolio";
import Landing from "./pages/Landing";
import Work from "./pages/Work";
import WorkSlug from "./pages/WorkSlug";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

export default function App() {
  useEffect(() => {
    if (!document.getElementById("pf-css")) {
      const el = document.createElement("style");
      el.id = "pf-css";
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/explore" element={<Portfolio />} />
      <Route path="/work" element={<Work />} />
      <Route path="/work/:slug" element={<WorkSlug />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
