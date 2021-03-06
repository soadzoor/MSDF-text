import {Scene, PerspectiveCamera, WebGLRenderer, TextureLoader, LinearFilter} from "three";
import {VignetteBackground} from "./VignetteBackground";
import {TextGroupManager, IFont, ITextGroup} from "./TextGroupManager";
import {DataLoader} from "./DataLoader";
import {FPSControls} from "./FPSControls";

export class SceneManager
{
	private _canvas: HTMLCanvasElement;
	private _scene: Scene;
	private _camera: PerspectiveCamera;
	private _controls: FPSControls;
	private _renderer: WebGLRenderer;

	constructor()
	{
		this._canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this._scene = new Scene();
		this._camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 7000);
		this._camera.position.set(-10, 0.1, 20);

		const texture = new TextureLoader().load("assets/Roboto-Bold.png", async () =>
		{
			this.initRenderer();

			texture.magFilter = LinearFilter;
			texture.minFilter = LinearFilter;
			texture.generateMipmaps = false;

			const font = (await DataLoader.loadJSON("assets/Roboto-Bold-msdf.json")) as IFont;
			const shakespeare = await DataLoader.loadTXT("assets/shakespeare.txt");

			const textLines = shakespeare.split("\n");
			// const textGroups: ITextGroup[] = [
			// 	{
			// 		lines: [
			// 			"AasdadsVasdasdVAVAVAvavavasdadwe.",
			// 			"Basdefef"
			// 		],
			// 		align: "left",
			// 		position: {
			// 			x: 0,
			// 			y: 0
			// 		}
			// 	},
			// 	{
			// 		lines: [
			// 			"CfbnfynsdfgYAYAdasdasVVasdawAWa..asd--",
			// 			"Dgrgserf"
			// 		],
			// 		align: "center",
			// 		position: {
			// 			x: 5,
			// 			y: 5
			// 		}
			// 	}
			// ];
			const textGroups: ITextGroup[] = [
				{
					lines: textLines,
					align: "left",
					position: {
						x: 0,
						y: 0
					}
				}
			];
			const text3D = new TextGroupManager(font, textGroups, texture, this._renderer.capabilities.isWebGL2);
			const mesh = text3D.instancedMesh;
			this._scene.add(mesh);
	
			this.initBackground();
			//this.initLights();
			this.initControls();
			
			//this.initMeshes();
			this.onWindowResize();
			this.animate(0);
		});
	}

	private initBackground()
	{
		const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !((<any>window).MSStream);

		this._scene.add(new VignetteBackground({
			aspect: this._camera.aspect,
			grainScale: IS_IOS ? 0 : 0.001, // mattdesl/three-vignette-background#1
			colors: ["#ffffff", "#353535"]
		}).mesh);
	}

	private initControls()
	{
		this._controls = new FPSControls(this);
		this._controls.setWASDSpeed(3);
		this._controls.activate();
	}

	private initRenderer()
	{
		const context = this._canvas.getContext("webgl2") || this._canvas.getContext("experimental-webgl2") as WebGLRenderingContext;
		this._renderer = new WebGLRenderer({
			antialias: true,
			canvas: this._canvas,
			context: <WebGLRenderingContext>context
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xECF8FF);

		this._canvas.addEventListener("webglcontextlost", this.onContextLost);

		window.addEventListener("resize", this.onWindowResize);
	}

	private onWindowResize = () =>
	{
		this._canvas.width = 0;
		this._canvas.height = 0;

		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	};

	private onContextLost = (event: Event) =>
	{
		event.preventDefault();

		alert("Unfortunately WebGL has crashed. Please reload the page to continue!");
	};

	public get scene()
	{
		return this._scene;
	}

	public get camera()
	{
		return this._camera;
	}

	public get canvas()
	{
		return this._canvas;
	}

	private update = (time: number) =>
	{
		this._controls.update();
		this._renderer.render(this._scene, this._camera);
	};

	private animate = (time: number) =>
	{
		this.update(time);
		this._renderer.setAnimationLoop(this.update);
	};
}