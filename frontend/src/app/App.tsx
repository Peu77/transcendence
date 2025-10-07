import { h, navigate } from "refreshjs";
import { TableTennis3D } from "./layout/TableTennis3D";

export default function App() {
  return (
    <div>
      <TableTennis3D
        onTableClick={() => {
          navigate("/app/game");
        }}
      />
    </div>
  );
}
