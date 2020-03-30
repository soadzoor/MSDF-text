import {Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, HemisphereLight, PlaneBufferGeometry, TextureLoader, Mesh, LinearFilter} from "three";
import { OrbitControls } from "./OrbitControls";
import { SceneLoader } from "./SceneLoader";
import { VignetteBackground } from "./VignetteBackground";
import {SDFTextShader} from "./SDFTextShader";

export class SceneManager
{
	private _canvas: HTMLCanvasElement;
	private _scene: Scene;
	private _camera: PerspectiveCamera;
	private _controls: OrbitControls;
	private _renderer: WebGLRenderer;
	private _sceneLoader: SceneLoader;

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById("myCanvas");
		this._scene = new Scene();
		this._camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 70);
		this._camera.position.set(0.1, 0.1, 2);

		const texture = new TextureLoader().load("assets/Roboto-Bold.png", () =>
		{
			this.initRenderer();

			texture.magFilter = LinearFilter;
			texture.minFilter = LinearFilter;
			texture.generateMipmaps = false;
			const geometry = new PlaneBufferGeometry();
			const material = new SDFTextShader(texture, this._renderer.capabilities.isWebGL2);

			const mesh = new Mesh(geometry, material);
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


	private initLights()
	{
		const light1  = new AmbientLight(0xFFFFFF, 0.1);

		const light2  = new DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(0.5, 0, 0.866); // ~60ยบ

		const light3 = new HemisphereLight(0xffffbb, 0x080820, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new OrbitControls(this._camera, this._canvas.parentElement);
		this._controls.activate();
	}

	private initMeshes()
	{
		this._sceneLoader = new SceneLoader(this, `assets/models/test.glb`);
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