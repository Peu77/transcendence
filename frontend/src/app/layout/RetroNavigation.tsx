import { useState, h } from "refreshjs";
import Button from "../../components/Button";

export const retroNavigationItems = [
  { id: "default", component: "App", label: "Home"},
  { id: "game", component: "Game", label: "Game" },
  { id: "scores", component: "Scores", label: "Scores" },
];

export function RetroNavigation() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <nav className="w-full bg-card border-b border-gray-700 shadow-md">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {retroNavigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
