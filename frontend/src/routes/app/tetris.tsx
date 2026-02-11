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
    [applyState, setPhase],
  );

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const TetrisRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: "/tetris",
  component: TetrisPage,
});
