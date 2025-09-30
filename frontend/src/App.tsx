import { h, Fragment, useState, useRef, useEffect } from 'refreshjs';
import { GameModeSelector } from './components/GameModeSelector';
import { RetroGameHeader } from './components/RetroGameHeader';
import { RetroNavigation } from './components/RetroNavigation';
import { TableTennis3D } from './components/TableTennis3D';
import { ThreeDMesh } from './components/3DMesh';

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

