import { h } from "refreshjs";
import Button from "../../components/Button";
import App from "../App";
import Game from "./Game";
import Scores from "./Scores";
import { navigate } from "refreshjs";

export const retroNavigationItems = [
  { id: "default", component: App, label: "Home" },
  { id: "game", component: Game, label: "Game" },
  { id: "scores", component: Scores, label: "Scores" },
];

export function RetroNavigation({ activeTab }: { activeTab: string }) {
  return (
    <nav className="w-full bg-card border-b border-gray-700 shadow-md">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {retroNavigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                navigate(item.id === "default" ? "/app" : `/app/${item.id}`);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
