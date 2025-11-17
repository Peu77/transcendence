import {
  Engine,
  Scene,
  PhotoDome,
  Vector3,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color4,
} from "@babylonjs/core";

import { BACKEND_URL } from "@/query/client";

export function singlePlayerGame(container: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  var engine = new Engine(canvas, true);

  var scene = new Scene(engine);

  var photo_dome = new PhotoDome(
    "photoDome",
    "/public/42832996790_71e52a157d_b.jpg",
    { resolution: 128, size: 400 },
    scene,
  );

  var camera = new FreeCamera("camera1", new Vector3(0, 25, 10), scene);

  camera.setTarget(new Vector3(0, 0, 0));

  camera.attachControl(canvas, true);

  const light = new HemisphericLight("light", new Vector3(3, 4, 6), scene);

  const floor = MeshBuilder.CreateGround(
    "floor",
    {
      width: 20,
      height: 40,
    },
    scene,
  );

  const floorMat = new StandardMaterial("wood", scene);
  floorMat.diffuseTexture = new Texture("textures/albedo.png", scene);

  floor.material = floorMat;

  const leftWall = MeshBuilder.CreateBox(
    "leftWall",
    {
      width: 0.5,
      height: 1,
      depth: 40,
      faceColors: [
        new Color4(0.66, 0.31, 0.02),
        new Color4(0.66, 0.31, 0.02),
        new Color4(0.66, 0.31, 0.02),
        new Color4(0.66, 0.31, 0.02),
        new Color4(0.66, 0.31, 0.02),
        new Color4(0.66, 0.31, 0.02),
      ],
    },
    scene,
  );
  leftWall.position.x = -10;
  leftWall.position.y = 0.5;


  const rightWall = leftWall.clone("rightWall");
  rightWall.position.x = 10;


  const line = MeshBuilder.CreateBox(
    "centerLine",
    {
      width: 20,
      height: 0.05,
      depth: 0.1,
      faceColors: [
        new Color4(0, 0, 0),
        new Color4(0, 0, 0),
        new Color4(0, 0, 0),
        new Color4(0, 0, 0),
        new Color4(0, 0, 0),
        new Color4(0, 0, 0),
      ],
    },
    scene,
  );
  line.position.y = 0.1;
  line.material = new StandardMaterial("lineMat", scene);


  const paddle1 = MeshBuilder.CreateBox(
    "paddle1",
    {
      width: 3,
      height: 0.5,
      depth: 0.5,
      faceColors: [
        new Color4(0.81, 0.06, 0.06),
        new Color4(0.81, 0.06, 0.06),
        new Color4(0.81, 0.06, 0.06),
        new Color4(0.81, 0.06, 0.06),
        new Color4(0.81, 0.06, 0.06),
        new Color4(0.81, 0.06, 0.06),
      ],
    },
    scene,
  );
  paddle1.position.z = 18;
  paddle1.position.y = 0.25;

  const paddle2 = paddle1.clone("paddle2");
  paddle2.position.z = -18;


  const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
  ball.position.y = 0.5;
  ball.position.z = -3;


  const ballTexture = new StandardMaterial("sphereMirror", scene);
  ballTexture.diffuseTexture = new Texture("textures/sphereMap.png", scene);
  ball.material = ballTexture;
  // const ballVelocity = new Vector3(0.15, 0, 0.03);

  const wsUrl = BACKEND_URL.replace("http", "ws") + "/game/ws";
  let ws: WebSocket | null = null;
  let currentRoomId: string | null = null;


  async function createGameRoom() {
    try {
      const response = await fetch(BACKEND_URL + "/game/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ type: "single" })
      });
      
      if (response.ok) {
        const data = await response.json();
        currentRoomId = data.roomId;
        console.log("Created room:", currentRoomId);

        connectWebSocket();
      } else {
        console.error("Failed to create room:", response.status);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  }

  function connectWebSocket() {
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.info("Game WS connected:", wsUrl);
        if (currentRoomId) {
          ws!.send(JSON.stringify({ 
            type: "join_room", 
            roomId: currentRoomId 
          }));
        }
      };

      ws.onmessage = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data);
          console.log("Received message:", msg);
          
          if (msg.type === "game_state" && msg.data) {
            applyState(msg.data);
          } else if (msg.type === "joined_room") {
            console.log("Successfully joined room:", msg.roomId);
          } else if (msg.type === "error") {
            console.error("Game error:", msg.data.message);
          }
        } catch (e) {
          console.error("Invalid WS message:", e);
        }
      };

      ws.onerror = (ev: Event) => {
        console.error("Game WS error:", ev);
      };

      ws.onclose = () => {
        console.info("Game WS closed");
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
    }
  }

  function applyState(state: any) {
    if (!state) return;
    
    if (state.ball && state.ball.position) {
      ball.position.copyFromFloats(
        (state.ball.position.x - 400) / 20,
        ball.position.y,
        (state.ball.position.y - 300) / 15
      );
    }
    

    if (state.paddles) {
      const paddleIds = Object.keys(state.paddles);
      
      if (paddleIds.length > 0) {
        const paddle1Data = state.paddles[paddleIds[0]];
        if (paddle1Data && paddle1Data.position) {
          paddle1.position.copyFromFloats(
            (paddle1Data.position.x - 400) / 20,
            paddle1.position.y,
            (paddle1Data.position.y - 300) / 15 
          );
        }
      }
      
      if (paddleIds.length > 1) {
        const paddle2Data = state.paddles[paddleIds[1]];
        if (paddle2Data && paddle2Data.position) {
          paddle2.position.copyFromFloats(
            (paddle2Data.position.x - 400) / 20,
            paddle2.position.y,
            (paddle2Data.position.y - 300) / 15
          );
        }
      }
    }
  }

  createGameRoom();


  container.addEventListener("pointermove", (e) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const rect = (canvas as HTMLCanvasElement).getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    const paddleY = relY * 600;
    ws.send(JSON.stringify({ 
      type: "paddle_move", 
      data: { paddleY } 
    }));
  });


  engine.runRenderLoop(() => {
    scene.render();
  });


  window.addEventListener("resize", () => {
    engine.resize();
  });


  window.addEventListener("beforeunload", () => {
    try {
      ws?.close();
    } catch {}
  });

  return scene;
}
