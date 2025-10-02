import { h, Link, useState, useEffect } from "refreshjs";
import { buttonClasses } from "./components/Button";
import toast from "./store/toast";

const authors = ["Emil", "Kira", "Konrad", "Matthias"];
const githubUrl = "https://github.com/peu77/transcendence";

export default function Home() {
  const fullText = "Transcendence";
  const [displayed, setDisplayed] = useState("");
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
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
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark");
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  };

  return (
    <div class="h-screen flex flex-col items-center justify-center bg-background">
      <h1 class="text-4xl font-bold mb-8">
        <span class="border-b-2 border-blue-400 pb-1 animate-pulse">
          {displayed}
        </span>
        <span class="animate-blink">
          {displayed.length < fullText.length ? "|" : ""}
        </span>
      </h1>
      <div class="flex gap-4 mb-4">
        <Link to="/login" class={buttonClasses()}>
          Login
        </Link>
        <Link
          to={githubUrl}
          target="_blank"
          rel="noopener"
          class={buttonClasses("secondary")}
        >
          GitHub
        </Link>
      </div>
      <div class="mb-8">
        <button
          class={buttonClasses("secondary", "sm")}
          onClick={() =>
            toast.success("Retro toast online!", {
              description: "This is a demo message.",
            })
          }
        >
          Show toast
        </button>
      </div>
      <button
        onClick={toggleDarkMode}
        class="absolute top-6 right-6 px-3 py-2 bg-card text-card-foreground rounded shadow transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg clip-pixel-corners-btn"
        aria-label="Toggle dark mode"
      >
        {isDark ? "White" : "Dark"}
      </button>
      <footer class="absolute bottom-6 text-gray-400 text-sm">
        Project by {authors.join(", ")}
      </footer>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s steps(1) infinite; }
      `}</style>
    </div>
  );
}
