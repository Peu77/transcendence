import {h, Fragment, Link} from 'refreshjs';
import { useState, useEffect } from 'refreshjs';

const authors = ['Emil', 'Kira', 'Konrad', 'Matthias'];
const githubUrl = 'https://github.com/peu77/transcendence'; // Replace with actual repo if needed

export default function Home() {
  const fullText = 'Transcendence';
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div class="h-screen flex flex-col items-center justify-center bg-background">
      <h1 class="text-4xl font-bold mb-8">
        <span class="border-b-2 border-blue-400 pb-1 animate-pulse">{displayed}</span>
        <span class="animate-blink">{displayed.length < fullText.length ? '|' : ''}</span>
      </h1>
      <div class="flex gap-4 mb-8">
        <Link to="/login" class="px-6 py-2 bg-primary hover:bg-primary rounded text-primary-foreground font-semibold shadow transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg clip-pixel-corners-btn">Login</Link>
        <Link to={githubUrl} target="_blank" rel="noopener" class="px-6 py-2 bg-secondary hover:bg-secondary rounded text-secondary-foreground font-semibold shadow transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg clip-pixel-corners-btn">GitHub</Link>
      </div>
      <footer class="absolute bottom-6 text-gray-400 text-sm">
        Project by {authors.join(', ')}
      </footer>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s steps(1) infinite; }
      `}</style>
    </div>
  );
}
