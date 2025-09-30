import { h, Fragment } from "refreshjs";
import { RetroGameHeader } from "./layout/RetroGameHeader";
import { RetroNavigation } from "./layout/RetroNavigation";
import { TableTennis3D } from "./layout/TableTennis3D";
import { ThreeDMesh } from "./layout/3DMesh";

export default function App() {
  return (
    <Fragment>
      <RetroGameHeader />
      <RetroNavigation />
      <TableTennis3D onTableClick={() => {}} />
      <ThreeDMesh />
    </Fragment>
  );
}
