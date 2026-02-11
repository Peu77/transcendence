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
/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const TetrisRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: "/tetris",
  component: TetrisPage,
});
