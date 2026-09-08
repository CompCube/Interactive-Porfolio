import { useNavigate, useSearchParams } from "react-router-dom";
import { QuickNav } from "../Portfolio";

export default function Work() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = params.get("category") || "all";

  return (
    <QuickNav
      open
      onClose={() => navigate("/")}
      onSelectProject={(m: { id: string }) => navigate(`/work/${m.id}`)}
      filter={filter}
      onFilterChange={(id: string) =>
        setParams(id === "all" ? {} : { category: id })
      }
      jumpToAll={false}
    />
  );
}
