import { useState, h } from "refreshjs";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/Card";
import Button from "@/components/Button";
import { C } from "node_modules/@tanstack/query-core/build/modern/hydration-B0J2Tmyo";

export function GameModeSelector() {
  const [active, setActive] = useState<string | null>(null);
  interface GameMode {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    icon: string;
  }
  const gameModes = [
    {
      id: "single",
      title: "SINGLE PLAYER",
      description: "Play against AI opponent",
      difficulty: "MEDIUM",
      icon: "🤖",
    },
    {
      id: "multiplayer",
      title: "MULTIPLAYER",
      description: "Challenge other players online",
      difficulty: "HARD",
      icon: "👥",
    },
    {
      id: "tournament",
      title: "TOURNAMENT",
      description: "Compete in ranked matches",
      difficulty: "EXTREME",
      icon: "🏆",
    },
    {
      id: "practice",
      title: "PRACTICE MODE",
      description: "Improve your skills",
      difficulty: "EASY",
      icon: "🎯",
    },
  ];
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-green-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "HARD":
        return "text-orange-400";
      case "EXTREME":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };
  return (
    <div className="flex flex-wrap items-center m-auto gap-6 justify-center">
      {gameModes.map((mode: GameMode) => (
        <Card
          key={mode.id}
          className={`p-6 cursor-pointer border-2 ${
            active === mode.id
              ? "border-cyan-400 bg-cyan-900/10"
              : "border-transparent hover:bg-secondary"
          } transition-all group`}
        >
          <CardContent className="p-0">
            <div className="flex items-center mb-4">
              <div
                className={`text-3xl mr-4 ${getDifficultyColor(
                  mode.difficulty
                )} group-hover:text-white transition-colors`}
              >
                {mode.icon}
              </div>
              <div className="flex flex-col">
                <h4
                  className={`text-sm font-mono tracking-wide ${
                    getDifficultyColor(mode.difficulty)
                  } group-hover:text-white transition-colors`}
                >
                  {mode.difficulty}
                </h4>
              </div>
            </div>
          </CardContent>
          <h3 className="text-cyan-400 font-mono tracking-wide mb-2 group-hover:text-white transition-colors">
            {mode.title}
          </h3>
          <p className="text-gray-400 text-sm font-mono leading-relaxed">
            {mode.description}
          </p>
          <div className="mt-4 text-xs text-gray-500 font-mono">
            › Click to select
          </div>
        </Card>
      ))}
      </div>
  );
}
