import { h, useState, useEffect } from "refreshjs";
import { RetroNavigation } from "./RetroNavigation";
import App from "../App";
import Game from "./Game";
import Scores from "./Scores";
import { ThreeDMesh } from "./3DMesh";

export default function Layout(props: any) {
  const [activeTab, setActiveTab] = useState("default");

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/app") setActiveTab("default");
    else if (path === "/app/game") setActiveTab("game");
    else if (path === "/app/scores") setActiveTab("scores");
    else setActiveTab("default");
  }, []);

  let content;
  if (activeTab === "game") {
    content = <Game />;
  } else if (activeTab === "scores") {
    content = <Scores />;
  } else {
    content = <App activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  return (
    <div>
      <RetroNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {content}
      <ThreeDMesh />
    </div>
  );
}