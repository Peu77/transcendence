import { h, useState, useEffect } from "refreshjs";
import { RetroNavigation } from "./RetroNavigation";
import App from "../App";
import Game from "./Game";
import Scores from "./Scores";
import { ThreeDMesh } from "./3DMesh";

export default function Layout(props: any) {
  let activeTab = "";

  const path = window.location.pathname;
  if (path === "/app") activeTab = "default";
  else if (path === "/app/game") activeTab = "game";
  else if (path === "/app/scores") activeTab = "scores";
  else activeTab = "default";

  return (
    <div>
      <RetroNavigation activeTab={activeTab} />
      {props.children}
      <ThreeDMesh />
    </div>
  );
}
