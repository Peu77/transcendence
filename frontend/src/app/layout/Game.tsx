import { h, useEffect, useRef } from "refreshjs";
import { GameModeSelector } from "./GameModeSelector";
import { singlePlayerGame } from "../../game/single_player";

export default function Game() {

  const containerId = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (containerId.current) {
      singlePlayerGame(containerId.current);
    }
  }
  , []);

  return <div ref={containerId} style={{ width: "100%", height: "100vh" }} />;
}