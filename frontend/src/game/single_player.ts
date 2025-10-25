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

  // 2. Left Wall
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

  // 3. Right Wall
  const rightWall = leftWall.clone("rightWall");
  rightWall.position.x = 10;

  // 4. Center Line (Visual Net)
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

  // 5. Paddles
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

  // 6. Ball
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
  ball.position.y = 0.5;
  ball.position.z = -3;

  // sphere texture

  const ballTexture = new StandardMaterial("sphereMirror", scene);
  ballTexture.diffuseTexture = new Texture("textures/sphereMap.png", scene);

  ball.material = ballTexture;

  const ballVelocity = new Vector3(0.15, 0, 0.03);

  scene.registerBeforeRender(() => {
    ball.position.addInPlace(ballVelocity);

    // Bounce on walls
    if (ball.position.x <= -9.75 || ball.position.x >= 9.75) {
      ballVelocity.x *= -1;
    }

    // Bounce on paddle1 (front)
    if (ball.intersectsMesh(paddle1, false) && ballVelocity.z > 0) {
      ballVelocity.z *= -1;
    }

    // Bounce on paddle2 (back)
    if (ball.intersectsMesh(paddle2, false) && ballVelocity.z < 0) {
      ballVelocity.z *= -1;
    }

    // Reset if out of bounds
    if (ball.position.z > 20 || ball.position.z < -20) {
      ball.position = new Vector3(0, 0.5, 0);
      ballVelocity.x = 0.1 * (Math.random() > 0.5 ? 1 : -1);
      ballVelocity.z = 0.2 * (Math.random() > 0.5 ? 1 : -1);
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  // Resize
  window.addEventListener("resize", () => {
    engine.resize();
  });
  return scene;
}
