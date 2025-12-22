import { Store } from "@tanstack/store";
import type { LiveSocket } from "./client";
import { createLiveSocket } from "./client";

export type RealtimeState = {
  socket: LiveSocket;
  status: "disconnected" | "connecting" | "connected";
};

const socket = createLiveSocket();

export const realtimeStore = new Store<RealtimeState>({
  socket,
  status: "disconnected",
});

let wired = false;

export function ensureRealtimeWired() {
  if (wired) return;
  wired = true;

  socket.on("connect", () => {
    realtimeStore.setState((s) => ({ ...s, status: "connected" }));
  });

  socket.on("disconnect", () => {
    realtimeStore.setState((s) => ({ ...s, status: "disconnected" }));
  });

  socket.on("connect_error", () => {
    realtimeStore.setState((s) => ({ ...s, status: "disconnected" }));
  });
}

export function connectRealtime() {
  ensureRealtimeWired();
  if (socket.connected) return;
  realtimeStore.setState((s) => ({ ...s, status: "connecting" }));
  socket.connect();
}

export function disconnectRealtime() {
  ensureRealtimeWired();
  socket.disconnect();
  realtimeStore.setState((s) => ({ ...s, status: "disconnected" }));
}
