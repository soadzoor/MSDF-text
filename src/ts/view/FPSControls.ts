import { Vector3, Spherical, MathUtils as THREEMath, PerspectiveCamera } from "three";
import { BoundedConvergence } from "../utils/BoundedConvergence";
import { SceneManager } from "./SceneManager";

export class FPSControls
{
	private _camera: PerspectiveCamera;
	private _canvas: HTMLCanvasElement;
	private _target: Vector3;
	private _spherical: Spherical;
	private _polarAngle: BoundedConvergence;
	private _azimuthAngle: BoundedConvergence;
	private _pointer: {x: number, y: number, prevX: number, prevY: number, isDown: boolean};
	private _mouseSensitivity: number;
	private _enabled: boolean;
	private _isKeyDown: {up: boolean, down: boolean, left: boolean, right: boolean};
	private _up: Vector3;
	private _forward: Vector3;
	private _forwardOffsetSpeed: BoundedConvergence;
	private _leftOffsetSpeed: BoundedConvergence;

	constructor(sceneManager: SceneManager)
	{
		this._camera = sceneManager.camera;
		this._canvas = sceneManager.canvas;

		this._pointer = {x: null, y: null, prevX: null, prevY: null, isDown: false};
		this._mouseSensitivity = 1;
		this._isKeyDown = {
			up: false,
			down: false,
			left: false,
			right: false
		};

		this._up = new Vector3(0, 1, 0);
		this._forward = new Vector3();
		this._target = new Vector3();
		this._forwardOffsetSpeed = new BoundedConvergence(0, 0, -1, 1);
		this._leftOffsetSpeed = new BoundedConvergence(0, 0, -1, 1);
		this._spherical = new Spherical();
		this._polarAngle = new BoundedConvergence(this._spherical.phi, this._spherical.phi, 0, Math.PI);
		this._azimuthAngle = new BoundedConvergence(this._spherical.theta, this._spherical.theta, -Infinity, Infinity);
	}

	public setWASDSpeed = (value: number) =>
	{
		this._forwardOffsetSpeed.reset(0, 0, -value, value);
		this._leftOffsetSpeed.reset(0, 0, -value, value);
	};

	public setSensitivity = (value: number) =>
	{
		this._mouseSensitivity = value;
	};

	private onKeyDown = (event: KeyboardEvent) =>
	{
		this.onKeyChange(event, true);
	};

	private onKeyUp = (event: KeyboardEvent) =>
	{
		this.onKeyChange(event, false);
	};

	private onKeyChange = (event: KeyboardEvent, isKeyDown: boolean) =>
	{
		const key = event.key.toLowerCase();

		if (key === "w" || key === "arrowup")
		{
			this._isKeyDown.up = isKeyDown;
		}
		else if (key === "a" || key === "arrowleft")
		{
			this._isKeyDown.left = isKeyDown;
		}
		else if (key === "s" || key === "arrowdown")
		{
			this._isKeyDown.down = isKeyDown;
		}
		else if (key === "d" || key === "arrowright")
		{
			this._isKeyDown.right = isKeyDown;
		}
	};

	public activate()
	{
		this._enabled = true;

		this._forwardOffsetSpeed.reset();
		this._leftOffsetSpeed.reset();

		this._camera.getWorldDirection(this._target);
		this._target.normalize();

		this._forward.copy(this._target).sub(this._camera.position).normalize();
		this._spherical.setFromVector3(this._forward);
		this._spherical.makeSafe();

		this._polarAngle.reset(this._spherical.phi, this._spherical.phi);
		this._azimuthAngle.reset(this._spherical.theta, this._spherical.theta);

		this._canvas.addEventListener("mousedown",  this.onMouseDown);
		window.addEventListener("mousemove",  this.onMouseMove);
		window.addEventListener("mouseup",    this.onPointerUp);

		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup",   this.onKeyUp);
	}

	public deactivate()
	{
		this._enabled = false;
		this._canvas.removeEventListener("mousedown",  this.onMouseDown);
		window.removeEventListener("mousemove",  this.onMouseMove);
		window.removeEventListener("mouseup",    this.onPointerUp);

		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup",   this.onKeyUp);
	}

	private onMouseDown = (event: MouseEvent) =>
	{
		this._pointer.x = event.clientX;
		this._pointer.y = event.clientY;
		this._pointer.isDown = true;
	};

	private onMouseMove = (event: MouseEvent) =>
	{
		event.preventDefault();

		if (this._pointer.isDown)
		{
			this.rotate(event.clientX, event.clientY);
		}
	};

	private rotate = (x: number, y: number) =>
	{
		this._pointer.x = x;
		this._pointer.y = y;

		if (this._pointer.prevX !== null && this._pointer.prevY !== null)
		{
			const deltaX = THREEMath.degToRad(this._pointer.x - this._pointer.prevX) * this._mouseSensitivity / 10;
			const deltaY = THREEMath.degToRad(this._pointer.y - this._pointer.prevY) * this._mouseSensitivity / 10;

			this._polarAngle.increaseEndBy(deltaY);
			this._azimuthAngle.decreaseEndBy(deltaX);
		}

		this._pointer.prevX = x;
		this._pointer.prevY = y;
	};

	private onPointerUp = () =>
	{
		this._pointer.isDown = false;
		this._pointer.x = null;
		this._pointer.y = null;
		this._pointer.prevX = null;
		this._pointer.prevY = null;
	};

	public get target()
	{
		return this._target;
	}

	private updateWASD = () =>
	{
		let forwardValue = 0;
		let leftValue = 0;

		if (this._isKeyDown.up)
		{
			forwardValue += 1;
		}
		if (this._isKeyDown.down)
		{
			forwardValue -= 1;
		}

		if (this._isKeyDown.left)
		{
			leftValue += 1;
		}
		if (this._isKeyDown.right)
		{
			leftValue -= 1;
		}
		this._forwardOffsetSpeed.setEnd(forwardValue);
		this._leftOffsetSpeed.setEnd(leftValue);
	};

	public update = () =>
	{
		this.updateWASD();
		this._azimuthAngle.update();
		this._polarAngle.update();
		this._forwardOffsetSpeed.update();
		this._leftOffsetSpeed.update();

		this._camera.getWorldDirection(this._target);
		this._target.normalize();


		const leftVector = this._up.clone().cross(this._target).normalize().multiplyScalar(this._leftOffsetSpeed.start);
		this._camera.position.add(this._target.clone().multiplyScalar(this._forwardOffsetSpeed.start)).add(leftVector);


		this._spherical.theta = this._azimuthAngle.start;
		this._spherical.phi = this._polarAngle.start;
		this._spherical.makeSafe();

		this._forward.setFromSpherical(this._spherical);
		this._target.copy(this._camera.position).add(this._forward);
		this._camera.lookAt(this._target);
	};
}