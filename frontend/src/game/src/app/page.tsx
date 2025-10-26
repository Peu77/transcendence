"use client";

import { useEffect, useRef } from "react";

import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoaderFlags } from "@babylonjs/core/Loading/sceneLoaderFlags";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";

import "@babylonjs/core/Cameras/universalCamera";

import "@babylonjs/core/Meshes/groundMesh";

import "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/XR/features/WebXRDepthSensing";

import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";

import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";

import "@babylonjs/core/Physics";

import "@babylonjs/materials/sky";

import { loadScene } from "babylonjs-editor-tools";

/**
 * We import the map of all scripts attached to objects in the editor.
 * This will allow the loader from `babylonjs-editor-tools` to attach the scripts to the
 * loaded objects (scene, meshes, transform nodes, lights, cameras, etc.).
 */
import { scriptsMap } from "@/scripts";

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const engine = new Engine(canvasRef.current, true, {
			stencil: true,
			antialias: true,
			audioEngine: true,
			adaptToDeviceRatio: true,
			disableWebGL2Support: false,
			useHighPrecisionFloats: true,
			powerPreference: "high-performance",
			failIfMajorPerformanceCaveat: false,
		});

		const scene = new Scene(engine);

		handleLoad(engine, scene);

		let listener: () => void;
		window.addEventListener("resize", listener = () => {
			engine.resize();
		});

		return () => {
			scene.dispose();
			engine.dispose();

			window.removeEventListener("resize", listener);
		};
	}, [canvasRef]);

	async function handleLoad(engine: Engine, scene: Scene) {
		console.log("Starting scene load...");
		
		// Remove physics for now since the single player game doesn't need it
		// const havok = await HavokPhysics();
		// scene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));

		try {
			// Try to load the scene file first
			SceneLoaderFlags.ForceFullSceneLoadingForIncremental = true;
			await loadScene("/scene/", "single_player.babylon", scene, scriptsMap, {
				quality: "high",
			});
			console.log("Scene loaded successfully");
		} catch (error) {
			console.warn("Failed to load scene file, creating script directly:", error);
			
			// Fallback: Create and start the single player script directly
			const SinglePlayerScript = scriptsMap["scripts/single_player.ts"].default;
			if (SinglePlayerScript) {
				const scriptInstance = new SinglePlayerScript();
				// Properly set the scene reference that the script expects
				(scriptInstance as any)._scene = scene;
				(scriptInstance as any).scene = scene;
				
				// Initialize the script
				scriptInstance.onStart();
				
				// Set up the update loop
				scene.registerBeforeRender(() => {
					scriptInstance.onUpdate();
				});
				
				console.log("SinglePlayerScript initialized successfully");
			} else {
				console.error("SinglePlayerScript not found in scriptsMap");
				console.log("Available scripts:", Object.keys(scriptsMap));
			}
		}

		// Wait for the camera to be available before starting render loop
		const waitForCamera = () => {
			if (scene.activeCamera) {
				console.log("Camera found:", scene.activeCamera.name);
				scene.activeCamera.attachControl(engine.getRenderingCanvas(), true);
				
				engine.runRenderLoop(() => {
					scene.render();
				});
				
				console.log("Render loop started");
			} else {
				console.log("No camera found, waiting...");
				// If no camera yet, wait a bit and try again
				setTimeout(waitForCamera, 100);
			}
		};

		waitForCamera();
	}

	return (
		<main className="flex w-screen h-screen flex-col items-center justify-between">
			<canvas
				ref={canvasRef}
				className="w-full h-full outline-none select-none"
			/>
		</main>
	);
}
