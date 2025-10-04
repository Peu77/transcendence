import { useState, h } from "refreshjs";

export function GameModeSelector() {
  const [active, setActive] = useState<string | null>(null);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto bg-card">
      {gameModes.map((mode) => (
        <button
          key={mode.id}
          className="bg-gray-900 border border-gray-700 hover:border-cyan-400 transition-all duration-300 p-6 text-left group hover:bg-gray-800"
          onClick={() => setActive(mode.id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-2xl">{mode.icon}</div>
            <div
              className={`text-xs font-mono ${getDifficultyColor(mode.difficulty)} bg-gray-800 px-2 py-1`}
            >
              {mode.difficulty}
            </div>
          </div>
          <h3 className="text-cyan-400 font-mono tracking-wide mb-2 group-hover:text-white transition-colors">
            {mode.title}
          </h3>
          <p className="text-gray-400 text-sm font-mono leading-relaxed">
            {mode.description}
          </p>
          <div className="mt-4 text-xs text-gray-500 font-mono">
            › Click to select
          </div>
        </button>
      ))}
    </div>
  );
}
