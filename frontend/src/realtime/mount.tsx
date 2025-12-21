import { useEffect } from "react";
import { connectRealtime, disconnectRealtime } from "./store";

/**
 * Mount this once in the authenticated area to connect the websocket.
 */
export function RealtimeMount() {
  useEffect(() => {
    connectRealtime();
    return () => disconnectRealtime();
  }, []);

  return null;
}

