import { h } from "refreshjs";
import { RetroNavigation } from "./RetroNavigation";
import { ThreeDMesh } from "./3DMesh";

export default function Layout(props: any) {
  return (
    <div>
      <RetroNavigation />
      {props.children}
      <ThreeDMesh />
    </div>
  );
}
