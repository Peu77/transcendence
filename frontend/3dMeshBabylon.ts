import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    MeshBuilder,
    HemisphericLight,
    Color3,
} from '@babylonjs/core';

export function create3DMesh(container: HTMLElement) {
    // Create canvas and append to container
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    // Create engine and scene
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    scene.clearColor.set(0, 0, 0, 0);

    // Camera
    const camera = new FreeCamera("camera1", new Vector3(0, 2, -5), scene);
    camera.setTarget(Vector3.Zero());
    // camera.attachControl(canvas, false);

    // Light
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    // Config
    const lineCount = 100;
    const pointsPerLine = 100;

    const waveHeight = 0.6;
    const waveSpeed = 1;
    const waveFrequency = 0.25;
    const spacing = 0.3;

    const centerOffset = (lineCount * spacing) / 2;

    // Horizontal lines (X-axis)
    const xAxisLines: Vector3[][] = [];
    for (let i = 0; i < lineCount; i++) {
        const z = i * spacing - centerOffset;
        const linePoints: Vector3[] = [];
        for (let j = 0; j < pointsPerLine; j++) {
            const x = j * spacing - centerOffset;
            linePoints.push(new Vector3(x, 0, z));
        }
        xAxisLines.push(linePoints);
    }

    // Vertical lines (Z-axis)
    const zAxisLines: Vector3[][] = [];
    for (let i = 0; i < lineCount; i++) {
        const x = i * spacing - centerOffset;
        const linePoints: Vector3[] = [];
        for (let j = 0; j < pointsPerLine; j++) {
            const z = j * spacing - centerOffset;
            linePoints.push(new Vector3(x, 0, z));
        }
        zAxisLines.push(linePoints);
    }

    // Set green color for all lines
    const green = new Color3(0, 1, 0);
    const xAxisColors = Array(xAxisLines.length).fill(Array(pointsPerLine).fill(green));
    const zAxisColors = Array(zAxisLines.length).fill(Array(pointsPerLine).fill(green));

    const xAxisSystem = MeshBuilder.CreateLineSystem("xLines", {
        lines: xAxisLines,
        updatable: true,
        colors: xAxisColors,
    }, scene);

    const zAxisSystem = MeshBuilder.CreateLineSystem("zLines", {
        lines: zAxisLines,
        updatable: true,
        colors: zAxisColors,
    }, scene);

    // Animate lines
    let time = 0;
    scene.registerBeforeRender(() => {
        time += engine.getDeltaTime() * 0.002;

        // Update points
        const updateWave = (lines: Vector3[][]) => {
            for (let i = 0; i < lineCount; i++) {
                for (let j = 0; j < pointsPerLine; j++) {
                    const point = lines[i][j];
                    const dist = Math.sqrt(point.x ** 2 + point.z ** 2);
                    point.y = Math.sin(dist * waveFrequency - time * waveSpeed) * waveHeight;
                }
            }
        };

        updateWave(xAxisLines);
        updateWave(zAxisLines);

        // Update meshes
        MeshBuilder.CreateLineSystem("xLines", {
            lines: xAxisLines,
            instance: xAxisSystem,
            updatable: true,
            colors: xAxisColors,
        });

        MeshBuilder.CreateLineSystem("zLines", {
            lines: zAxisLines,
            instance: zAxisSystem,
            updatable: true,
            colors: zAxisColors,
        });
    });

    // Start rendering
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Handle resize
    window.addEventListener("resize", () => {
        engine.resize();
    });

    return scene;
}