import { h, useEffect, useRef } from "refreshjs";
import { create3DMesh } from "../../3dMeshBabylon";
export function ThreeDMesh() {
  const containerId = useRef(null);

  useEffect(() => {
    if (containerId.current) {
      create3DMesh(containerId.current);
    }
  }, [])

  return (
    <div
        ref={containerId}
    />
  );
}