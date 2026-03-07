import {useEffect, useState} from "react";
import {Link} from "@tanstack/react-router";
import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {toast} from "sonner";

const authors = ["Emil", "Konrad", "Jonas", "Theo", "Charlotte"];
const githubUrl = "https://github.com/peu77/transcendence";

export default function Home() {
  const fullText = "Transcendence";
  const [displayed, setDisplayed] = useState("");
  const [isDark, setIsDark] = useState(() =>
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-4xl font-bold mb-8">
        <span className="border-b-2 border-blue-400 pb-1 animate-pulse">
          {displayed}
        </span>
          <span className="animate-blink">
          {displayed.length < fullText.length ? "|" : ""}
        </span>
        </h1>
        <div className="flex gap-4 mb-4">
          <Link to="/login" className={buttonVariants()}>
            Login
          </Link>
          <Link
              to={githubUrl}
              target="_blank"
              rel="noopener"
              className={buttonVariants({
                variant: "secondary",
              })}
          >
            GitHub
          </Link>

            <Button onClick={() => toast.error("This is a success toast!")}>
                test
            </Button>
        </div>

        <button
            onClick={toggleDarkMode}
            className="absolute top-6 right-6 px-3 py-2 bg-card text-card-foreground rounded shadow transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg clip-pixel-corners-btn"
            aria-label="Toggle dark mode"
        >
          {isDark ? "White" : "Dark"}
        </button>
        <footer className="absolute bottom-6 text-gray-400 text-sm">
          Project by {authors.join(", ")}
        </footer>
        <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s steps(1) infinite; }
      `}</style>
      </div>
  );
}
