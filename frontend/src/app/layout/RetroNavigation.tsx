import { h } from "refreshjs";
import Button from "../../components/Button";
import App from "../App";
import Game from "./Game";
import Scores from "./Scores";
import { navigate, useCurrentRoute } from "refreshjs";

export const retroNavigationItems = [
  { id: "", component: App, label: "Home", index: true },
  { id: "game", component: Game, label: "Game", index: false },
  { id: "scores", component: Scores, label: "Scores", index: false },
];

export function RetroNavigation() {
  const { child } = useCurrentRoute();

  return (
    <nav className="w-full bg-card border-b border-gray-700 shadow-md">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {retroNavigationItems.map((item) => (
            <Button
              key={item.id}
              variant={child?.path === item.id ? "default" : "ghost"}
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
