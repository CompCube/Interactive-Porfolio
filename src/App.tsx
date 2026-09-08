import { Routes, Route } from "react-router-dom";
import Portfolio from "./Portfolio";
import Landing from "./pages/Landing";
import Work from "./pages/Work";
import WorkSlug from "./pages/WorkSlug";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/explore" element={<Portfolio />} />
      <Route path="/work" element={<Work />} />
      <Route path="/work/:slug" element={<WorkSlug />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
