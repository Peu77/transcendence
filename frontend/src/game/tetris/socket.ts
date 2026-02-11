import { io, type Socket } from "socket.io-client";
import { env } from "@/env";
import type { InputAction, TetrisState } from "./types";

/* ------------------------------------------------------------------ */
/*  Type definitions for the game namespace                           */
/* ------------------------------------------------------------------ */

type GameServerToClientEvents = {
  ready: (data: { userId: string; hasSession: boolean; paused: boolean }) => void;
  "tetris.countdown": (data: { count: number }) => void;
  "tetris.state": (state: TetrisState) => void;
  "tetris.paused": (state: TetrisState) => void;
  "tetris.resumed": (state: TetrisState) => void;
  "tetris.gameover": (data: { score: number; lines: number; level: number }) => void;
  "tetris.session-found": (state: TetrisState) => void;
  "tetris.no-session": () => void;
};

type GameClientToServerEvents = {
  "tetris.start": () => void;
  "tetris.input": (body: { action: InputAction }) => void;
  "tetris.pause": () => void;
  "tetris.resume": () => void;
  "tetris.reconnect": () => void;
};

export type GameSocket = Socket<GameServerToClientEvents, GameClientToServerEvents>;

/* ------------------------------------------------------------------ */
/*  Session persistence (survives page reload)                        */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "tetris_active_session";

export function markSessionActive(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function markSessionInactive(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasActiveSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

/* ------------------------------------------------------------------ */
/*  Socket instance & lifecycle                                       */
/* ------------------------------------------------------------------ */

let socket: GameSocket | null = null;

export function getGameSocket(): GameSocket {
  if (!socket) {
    const url = new URL(env.VITE_BACKEND_URL);
    const baseUrl = `${url.protocol}//${url.host}`;

    socket = io(`${baseUrl}/game`, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function connectGameSocket(): GameSocket {
  const s = getGameSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectGameSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/* ------------------------------------------------------------------ */
/*  Game actions                                                      */
/* ------------------------------------------------------------------ */

export function startGame(): void {
  getGameSocket().emit("tetris.start");
}

export function sendInput(action: InputAction): void {
  getGameSocket().emit("tetris.input", { action });
}

export function pauseGame(): void {
  getGameSocket().emit("tetris.pause");
}

export function resumeGame(): void {
  getGameSocket().emit("tetris.resume");
}

export function requestReconnect(): void {
  getGameSocket().emit("tetris.reconnect");
}