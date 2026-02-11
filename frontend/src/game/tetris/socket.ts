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

