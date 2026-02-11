import { createRoute } from "@tanstack/react-router";
import { AppRoute } from "@/routes/app/layout.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { TetrisRenderer } from "@/game/tetris/renderer";
import {
  connectGameSocket,
  disconnectGameSocket,
  hasActiveSession,
  markSessionActive,
  markSessionInactive,
  pauseGame,
  requestReconnect,
  resumeGame,
  sendInput,
  startGame,
  type GameSocket,
} from "@/game/tetris/socket";
import type { InputAction, TetrisState } from "@/game/tetris/types";

/* ------------------------------------------------------------------ */
/*  State types                                                       */
/* ------------------------------------------------------------------ */

type Phase = "idle" | "countdown" | "playing" | "paused" | "gameover";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function TetrisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TetrisRenderer | null>(null);
  const socketRef = useRef<GameSocket | null>(null);
  /** Keep phase in a ref too so event callbacks always see the latest value */
  const phaseRef = useRef<Phase>("idle");

  const [phase, setPhaseState] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [finalScore, setFinalScore] = useState<{
    score: number;
    lines: number;
    level: number;
  } | null>(null);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  /** Apply a state snapshot from the server to the UI */
  const applyState = useCallback((state: TetrisState) => {
    setScore(state.score);
    setLines(state.lines);
    setLevel(state.level);
    rendererRef.current?.render(state);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Wire up all socket listeners (shared by start & reconnect)      */
  /* ---------------------------------------------------------------- */

  const wireSocket = useCallback(
    (socket: GameSocket) => {
      // Remove all previous game listeners to avoid duplicates
      socket.removeAllListeners("tetris.countdown");
      socket.removeAllListeners("tetris.state");
      socket.removeAllListeners("tetris.paused");
      socket.removeAllListeners("tetris.resumed");
      socket.removeAllListeners("tetris.gameover");
      socket.removeAllListeners("tetris.session-found");
      socket.removeAllListeners("tetris.no-session");

      socket.on("tetris.countdown", (data) => {
        setCountdown(data.count);
        if (data.count === 0) {
          setPhase("playing");
        }
      });

      socket.on("tetris.state", (state) => {
        applyState(state);
      });

      socket.on("tetris.paused", (state) => {
        setPhase("paused");
        applyState(state);
      });

      socket.on("tetris.resumed", (state) => {
        setPhase("playing");
        applyState(state);
      });

      socket.on("tetris.gameover", (data) => {
        setPhase("gameover");
        setFinalScore(data);
        markSessionInactive();
      });

      socket.on("tetris.session-found", (state) => {
        // Server found our old session — render its state and show paused overlay
        setPhase("paused");
        applyState(state);
      });

      socket.on("tetris.no-session", () => {
        // No session on server — go back to idle
        markSessionInactive();
        setPhase("idle");
      });
    },
    [applyState, setPhase],
  );

  /* ---------------------------------------------------------------- */
  /*  Setup renderer on mount                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new TetrisRenderer(canvas);
    rendererRef.current = renderer;

    const handleResize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      renderer.resize(container.clientWidth, container.clientHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Auto-reconnect on mount if we had a session                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!hasActiveSession()) return;

    const socket = connectGameSocket();
    socketRef.current = socket;
    wireSocket(socket);

    const onReady = () => {
      requestReconnect();
      socket.off("ready", onReady);
    };

    socket.on("ready", onReady);
    if (socket.connected) {
      requestReconnect();
    }

    return () => {
      // Don't disconnect on unmount if game is playing/paused — let it persist
    };
  }, [wireSocket]);

  /* ---------------------------------------------------------------- */
  /*  Cleanup socket on component unmount                             */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      disconnectGameSocket();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Start a new game                                                */
  /* ---------------------------------------------------------------- */

  const handleStart = useCallback(() => {
    setPhase("countdown");
    setFinalScore(null);
    setScore(0);
    setLines(0);
    setLevel(1);

    const socket = connectGameSocket();
    socketRef.current = socket;
    wireSocket(socket);

    const onReady = () => {
      startGame();
      markSessionActive();
      socket.off("ready", onReady);
    };

    socket.on("ready", onReady);

    // If already connected, start right away
    if (socket.connected) {
      startGame();
      markSessionActive();
    }
  }, [wireSocket, setPhase]);

  /* ---------------------------------------------------------------- */
  /*  Resume from pause                                               */
  /* ---------------------------------------------------------------- */

  const handleResume = useCallback(() => {
    resumeGame();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Keyboard input                                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const keyMap: Record<string, InputAction> = {
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
      ArrowUp: "rotate",
      w: "rotate",
      W: "rotate",
      ArrowDown: "softDrop",
      s: "softDrop",
      S: "softDrop",
      " ": "hardDrop",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentPhase = phaseRef.current;

      // ESC toggles pause
      if (e.key === "Escape") {
        e.preventDefault();
        if (currentPhase === "playing") {
          pauseGame();
        } else if (currentPhase === "paused") {
          handleResume();
        }
        return;
      }

      if (currentPhase !== "playing") return;
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        sendInput(action);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleResume]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-4rem)] gap-4 select-none">
      {/* Score bar */}
      <div className="flex gap-8 text-lg font-bold tracking-wide text-foreground/80">
        <span>SCORE {score}</span>
        <span>LINES {lines}</span>
        <span>LEVEL {level}</span>
      </div>

      {/* Game area */}
      <div className="relative w-full max-w-[700px] aspect-[7/10] flex-shrink-0">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Overlays */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Button
              onClick={handleStart}
              className="clip-pixel-corners-btn bg-cyan-500 hover:bg-cyan-400 text-white px-10 py-6 text-2xl font-bold"
            >
              START GAME
            </Button>
          </div>
        )}

        {phase === "countdown" && countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-8xl font-bold text-white animate-pulse">
              {countdown === 0 ? "GO!" : countdown}
            </span>
          </div>
        )}

        {phase === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60">
            <span className="text-5xl font-bold text-yellow-300">PAUSED</span>
            <Button
              onClick={handleResume}
              className="clip-pixel-corners-btn bg-cyan-500 hover:bg-cyan-400 text-white px-8 py-4 text-xl font-bold"
            >
              RESUME
            </Button>
            <span className="text-sm text-white/50">Press ESC to resume</span>
          </div>
        )}

        {phase === "gameover" && finalScore && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/70">
            <span className="text-5xl font-bold text-red-400">GAME OVER</span>
            <div className="flex flex-col items-center gap-1 text-xl text-white/80">
              <span>Score: {finalScore.score}</span>
              <span>Lines: {finalScore.lines}</span>
              <span>Level: {finalScore.level}</span>
            </div>
            <Button
              onClick={handleStart}
              className="clip-pixel-corners-btn bg-cyan-500 hover:bg-cyan-400 text-white px-8 py-4 text-xl font-bold"
            >
              PLAY AGAIN
            </Button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      {phase === "playing" && (
        <div className="text-sm text-foreground/50 tracking-wide">
          ARROWS / WASD to move &middot; SPACE to hard drop &middot; ESC to
          pause
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const TetrisRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: "/tetris",
  component: TetrisPage,
});
