import { h, Fragment, useState, useRef, useEffect } from 'refreshjs';
import { GameModeSelector } from './webpage_components/GameModeSelector';
import { RetroGameHeader } from './webpage_components/RetroGameHeader';
import { RetroNavigation } from './webpage_components/RetroNavigation';
import { TableTennis3D } from './webpage_components/TableTennis3D';
import { ThreeDMesh } from './webpage_components/3DMesh';

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

