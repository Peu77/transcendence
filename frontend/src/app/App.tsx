import { h } from "refreshjs";
import { TableTennis3D } from "./layout/TableTennis3D";

export default function App({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <div>
     <TableTennis3D onTableClick={() => 
      {
        setActiveTab("game");
        window.history.pushState({}, "", "/app/game");
      }} />
    </div>
  );
}
