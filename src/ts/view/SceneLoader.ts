import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { SceneManager } from './SceneManager';

export class SceneLoader
{
	private _sceneManager: SceneManager;
	private _url: string;
	
	constructor(scene: SceneManager, url: string)
	{
		this._sceneManager = scene;
		this._url = url;

		this.loadScene(this._url);
	}

	private loadScene = (url: string) =>
	{
		const gltfLoader = new GLTFLoader();
		
		//DRACOLoader.setDecoderPath('../decoder/');
		//gltfLoader.setDRACOLoader(new DRACOLoader());

		gltfLoader.load(url, this.onLoad);
	};

	private onLoad = (gltf: GLTF) =>
	{
		const object = gltf.scene;
		this._sceneManager.scene.add(object);
	};
}