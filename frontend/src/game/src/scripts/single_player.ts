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
    Color3,
    Color4,
    Node
} from "@babylonjs/core";

import { AdvancedDynamicTexture, TextBlock, Control } from "@babylonjs/gui";

// Import side-effect modules that might be needed
import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/texture";

export default class SinglePlayerScript {
    private ballVelocity: Vector3 = new Vector3(0.15, 0, 0.03);
    private ball: any;
    private paddle1: any;
    private paddle2: any;
    private scene: Scene | null = null;
    private keys: { [ key: string ]: boolean } = {};
    private player1Score: number = 0;
    private player2Score: number = 0;
    private gameState: 'countdown' | 'playing' | 'paused' = 'countdown';
    private countdownValue: number = 3;
    private countdownUI: AdvancedDynamicTexture | null = null;
    private countdownText: TextBlock | null = null;


    public onStart(): void {
        console.log("SinglePlayerScript onStart called");
        
        // Get scene reference
        this.scene = (this as any)._scene || (this as any).scene;
        if (!this.scene) {
            console.error("No scene found for SinglePlayerScript");
            return;
        }

        console.log("Scene found, initializing game...");
        const scene = this.scene;

        // Setup keyboard input
        this.setupKeyboardInput(scene);

        // Create PhotoDome
        try {
            const photo_dome = new PhotoDome(
                "photoDome",
                "/42832996790_71e52a157d_b.jpg",
                { resolution: 128, size: 400 },
                scene
            );
            console.log("PhotoDome created");
        } catch (error) {
            console.warn("Failed to create PhotoDome:", error);
        }

        // Create Camera - positioned further back and higher for better table view
        var camera = new FreeCamera("camera1", new Vector3(0, 35, 25), scene);
        camera.setTarget(new Vector3(0, 0, 0));
        
        // Set as active camera
        scene.activeCamera = camera;
        console.log("Camera created and set as active");

        try {
            const engine = scene.getEngine();
            if (engine && engine.getRenderingCanvas()) {
                // Don't attach camera controls at all
                // camera.attachControl(engine.getRenderingCanvas(), true);
                
                // Or if you need to attach for some reason, disable specific keys
                camera.attachControl(engine.getRenderingCanvas(), true);
                camera.keysUp = [];
                camera.keysDown = [];
                camera.keysLeft = [];
                camera.keysRight = [];
                console.log("Camera controls disabled");
            }
        } catch (error) {
            console.log("Could not setup camera:", error);
        }

        // Create Light
        const light = new HemisphericLight("light", new Vector3(3, 4, 6), scene);
        console.log("Light created");

        // Create Floor
        const floor = MeshBuilder.CreateGround("floor", {
            width: 20,
            height: 40
        }, scene);

        const floorMat = new StandardMaterial("wood", scene);
        try {
            floorMat.diffuseTexture = new Texture("/albedo.png", scene);
            console.log("Floor texture loaded");
        } catch (error) {
            console.warn("Failed to load floor texture:", error);
        }
        floor.material = floorMat;
        console.log("Floor created");

        // Create Left Wall
        const leftWall = MeshBuilder.CreateBox("leftWall", {
            width: 0.5,
            height: 1,
            depth: 40,
            faceColors: [
                new Color4(0.66, 0.31, 0.02, 1),
                new Color4(0.66, 0.31, 0.02, 1),
                new Color4(0.66, 0.31, 0.02, 1),
                new Color4(0.66, 0.31, 0.02, 1),
                new Color4(0.66, 0.31, 0.02, 1),
                new Color4(0.66, 0.31, 0.02, 1)
            ]
        }, scene);
        leftWall.position.x = -10;
        leftWall.position.y = 0.5;

        // Create Right Wall
        const rightWall = leftWall.clone("rightWall");
        rightWall.position.x = 10;

        // Create Center Line
        const line = MeshBuilder.CreateBox("centerLine", {
            width: 20,
            height: 0.05,
            depth: 0.1,
            faceColors: [
                new Color4(0, 0, 0, 1),
                new Color4(0, 0, 0, 1),
                new Color4(0, 0, 0, 1),
                new Color4(0, 0, 0, 1),
                new Color4(0, 0, 0, 1),
                new Color4(0, 0, 0, 1)
            ]
        }, scene);
        line.position.y = 0.1;

        // Create Paddles
        this.paddle1 = MeshBuilder.CreateBox("paddle1", {
            width: 3,
            height: 0.5,
            depth: 0.5,
            faceColors: [
                new Color4(0.81, 0.06, 0.06, 1),
                new Color4(0.81, 0.06, 0.06, 1),
                new Color4(0.81, 0.06, 0.06, 1),
                new Color4(0.81, 0.06, 0.06, 1),
                new Color4(0.81, 0.06, 0.06, 1),
                new Color4(0.81, 0.06, 0.06, 1)
            ]
        }, scene);
        this.paddle1.position.z = 18;
        this.paddle1.position.y = 0.25;

        this.paddle2 = this.paddle1.clone("paddle2");
        this.paddle2.position.z = -18;

        // Create Ball
        this.ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
        this.ball.position.y = 0.5;
        this.ball.position.z = -3;

        // Ball texture
        const ballTexture = new StandardMaterial("sphereMirror", scene);
        ballTexture.diffuseColor = new Color3(1, 1, 1); // White ball
        this.ball.material = ballTexture;

        // Initialize countdown UI
        this.setupCountdownUI();
        
        // Start countdown
        this.startCountdown();
    }

    private setupCountdownUI(): void {
        if (!this.scene) return;
        
        // Create fullscreen UI
        this.countdownUI = AdvancedDynamicTexture.CreateFullscreenUI("countdownUI");
        
        // Create countdown text
        this.countdownText = new TextBlock();
        this.countdownText.text = this.countdownValue.toString();
        this.countdownText.color = "white";
        this.countdownText.fontSize = 120;
        this.countdownText.fontFamily = "Arial Black";
        this.countdownText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countdownText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.countdownText.outlineWidth = 4;
        this.countdownText.outlineColor = "black";
        
        this.countdownUI.addControl(this.countdownText);
    }

    private startCountdown(): void {
        if (!this.countdownText) return;
        
        this.gameState = 'countdown';
        this.countdownValue = 3;
        
        const countdownInterval = setInterval(() => {
            if (this.countdownValue > 0) {
                this.countdownText!.text = this.countdownValue.toString();
                
                // Add scaling animation for dramatic effect
                this.countdownText!.transformCenterX = 0.5;
                this.countdownText!.transformCenterY = 0.5;
                this.countdownText!.scaleX = 1.5;
                this.countdownText!.scaleY = 1.5;
                
                // Animate scale back to normal
                setTimeout(() => {
                    if (this.countdownText) {
                        this.countdownText.scaleX = 1;
                        this.countdownText.scaleY = 1;
                    }
                }, 300);
                
                this.countdownValue--;
            } else {
                // Show "GO!" and then start the game
                this.countdownText!.text = "GO!";
                this.countdownText!.color = "green";
                this.countdownText!.scaleX = 1.5;
                this.countdownText!.scaleY = 1.5;
                
                setTimeout(() => {
                    // Hide countdown UI and start game
                    if (this.countdownUI) {
                        this.countdownUI.dispose();
                        this.countdownUI = null;
                        this.countdownText = null;
                    }
                    this.gameState = 'playing';
                    console.log("Game started!");
                }, 1000);
                
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    private resetBall(): void {
        if (!this.ball) return;
        
        // Reset ball position to center
        this.ball.position = new Vector3(0, 0.5, 0);
        
        // Set random initial velocity
        this.ballVelocity.x = 0.1 * (Math.random() > 0.5 ? 1 : -1);
        this.ballVelocity.z = 0.2 * (Math.random() > 0.5 ? 1 : -1);
    }

    public onUpdate(): void {
        if (!this.scene || !this.ball || this.gameState !== 'playing') return;

        // Game loop - this is called every frame by the editor
        this.ball.position.addInPlace(this.ballVelocity);

        // Bounce on walls
        if (this.ball.position.x <= -9.75 || this.ball.position.x >= 9.75) {
            this.ballVelocity.x *= -1;
        }

        // Bounce on paddle1 (front)
        if (this.ball.intersectsMesh(this.paddle1, false) && this.ballVelocity.z > 0) {
            this.ballVelocity.z *= -1;
        }

        // Bounce on paddle2 (back)
        if (this.ball.intersectsMesh(this.paddle2, false) && this.ballVelocity.z < 0) {
            this.ballVelocity.z *= -1;
        }

        // Reset if out of bounds
        if (this.ball.position.z > 20 || this.ball.position.z < -20) {
            // Update scores
            if (this.ball.position.z > 20) {
                this.player2Score++;
                console.log(`Player 2 scores! Score: Player 1: ${this.player1Score}, Player 2: ${this.player2Score}`);
            } else {
                this.player1Score++;
                console.log(`Player 1 scores! Score: Player 1: ${this.player1Score}, Player 2: ${this.player2Score}`);
            }

            // Reset ball position and restart countdown
            this.resetBall();
            this.setupCountdownUI();
            this.startCountdown();
        }

        // Paddle movement
                // Paddle movement - reversed controls
        if (this.keys[ "ArrowLeft" ] && this.paddle1.position.x < 8.5) {
            this.paddle1.position.x += 0.2; // ArrowLeft now moves right
        }
        if (this.keys[ "ArrowRight" ] && this.paddle1.position.x > -8.5) {
            this.paddle1.position.x -= 0.2; // ArrowRight now moves left
        }
        if (this.keys[ "a" ] && this.paddle2.position.x < 8.5) {
            this.paddle2.position.x += 0.2; // 'a' now moves right
        }
        if (this.keys[ "d" ] && this.paddle2.position.x > -8.5) {
            this.paddle2.position.x -= 0.2; // 'd' now moves left
        }
    }

    private setupKeyboardInput(scene: Scene): void {
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case 1: // Key down
                    this.keys[ kbInfo.event.key ] = true;
                    // Prevent camera movement for game control keys
                    if (kbInfo.event.key === "ArrowLeft" || 
                        kbInfo.event.key === "ArrowRight" || 
                        kbInfo.event.key === "a" || 
                        kbInfo.event.key === "d") {
                        kbInfo.event.preventDefault();
                        kbInfo.event.stopPropagation();
                    }
                    break;
                case 2: // Key up
                    this.keys[ kbInfo.event.key ] = false;
                    // Prevent camera movement for game control keys
                    if (kbInfo.event.key === "ArrowLeft" || 
                        kbInfo.event.key === "ArrowRight" || 
                        kbInfo.event.key === "a" || 
                        kbInfo.event.key === "d") {
                        kbInfo.event.preventDefault();
                        kbInfo.event.stopPropagation();
                    }
                    break;
            }
        });
    }
}