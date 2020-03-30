import { SceneManager } from "./view/SceneManager";
import { Model } from './model/Model';

export class Main
{
	public static instance: Main;
	public static getInstance(): Main
	{
		return Main.instance || new Main();
	}

	private _model: Model;
	private _sceneManager: SceneManager;

	constructor()
	{
		Main.instance = this;

		this._model = new Model();
		this._sceneManager = new SceneManager();
	}

	public get scene()
	{
		return this._sceneManager;
	}

	public get model()
	{
		return this._model;
	}
}

const main = Main.getInstance();