import { h, Fragment, useState, useRef, useEffect } from 'refreshjs';
import { GameModeSelector } from './components/GameModeSelector';
import { ImageWithFallback } from './components/ImageWithFallback';
import { RetroGameHeader } from './components/RetroGameHeader';
import { RetroNavigation } from './components/RetroNavigation';
import { TableTennis3D } from './components/TableTennis3D';
import MigratedComponent from './components/MigratedComponent';

export default function App() {
  const [count, setCount] = useState(0);
  const lastUpdated = useRef<Date | null>(null);

  useEffect(() => {
    lastUpdated.current = new Date();
  }, [count]);

  return (
    <Fragment>
      <RetroGameHeader />
      <RetroNavigation />
        <TableTennis3D onTableClick={() => {}} />
    </Fragment>
  );
}
// {/* <GameModeSelector /> */}