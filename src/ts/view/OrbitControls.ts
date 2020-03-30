import { EventDispatcher, MOUSE, Quaternion, Vector3, Spherical, PerspectiveCamera, Vector2, MathUtils as THREEMath } from 'three';
import { BoundedConvergence } from 'utils/BoundedConvergence';

const TWEEN = require('tween.js');

/** OrbitControls based on js' OrbitControls, extended with zoomdamping, dynamic targeting and positionchanging. Original authors:
 *
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

interface OrbitControlsConfig
{
	enabled: boolean;
	enableRotate: boolean;
	rotateSpeed: number;
	rotationDamping: number;
	enableZoom: boolean;
	zoomSpeed: number;
	autoRotate: boolean;
	autoRotateSpeed: number;
	enablePan: boolean;
	panSpeed: number;
	minDistance: number;
	maxDistance: number;
}

export class OrbitControls extends EventDispatcher
{
	private _camera: PerspectiveCamera;
	private _domElement: HTMLElement;
	private _target: Vector3;
	private _distance: BoundedConvergence;
	private _polarAngle: BoundedConvergence;
	private _azimuthAngle: BoundedConvergence;
	private _spherical: Spherical;

	private _offset: Vector3;
	private _quat: Quaternion;
	private _quatInverse: Quaternion;

	private _pointer: {x: number, y: number, prevX: number, prevY: number, isDown: boolean};
	private _pinchDistance: {current: number, previous: number};

	private _config: OrbitControlsConfig;

	// Mouse buttons
	private _mouseButtons = {LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT};

	constructor(camera: PerspectiveCamera, domElement: HTMLElement, config?: OrbitControlsConfig)
	{
		super();
		this._camera = camera;
		this._domElement = domElement;
		this._target = new Vector3();
		this._quat = new Quaternion().setFromUnitVectors(this._camera.up, new Vector3(0, 1, 0));
		this._quatInverse = this._quat.clone().inverse();
		this._spherical = new Spherical();

		this._offset = new Vector3();
		this._offset.copy(this._camera.position).sub(this._target);
		this._offset.applyQuaternion(this._quat);
		this._spherical.setFromVector3(this._offset);
		this._spherical.makeSafe();

		const offsetLength = this._offset.length();
		this._distance = new BoundedConvergence(offsetLength, offsetLength, 40, 800);
		this._polarAngle = new BoundedConvergence(this._spherical.phi, this._spherical.phi, 0, Math.PI);
		this._azimuthAngle = new BoundedConvergence(this._spherical.theta, this._spherical.theta, -Infinity, Infinity);

		this._pointer = {x: null, y: null, prevX: null, prevY: null, isDown: false};
		this._pinchDistance = {current: null, previous: null};

		this._config = config || {
			enabled: false,
			enableRotate: true,
			rotateSpeed: 1,
			rotationDamping: 0.1,
			enableZoom: true,
			zoomSpeed: 0.5,
			autoRotate: false,
			autoRotateSpeed: 2,
			enablePan: false,
			panSpeed: 1,
			minDistance: 1,
			maxDistance: 3
		};

		this._distance = new BoundedConvergence(offsetLength, offsetLength, this._config.minDistance, this._config.maxDistance);
	}

	public activate()
	{
		this._config.enabled = true;
		this._domElement.addEventListener( 'mousedown',  this.onMouseDown);
		this._domElement.addEventListener( 'mousemove',  this.onMouseMove);
		this._domElement.addEventListener( 'mouseup',    this.onPointerUp);
		this._domElement.addEventListener( 'mouseleave', this.onPointerUp);
		this._domElement.addEventListener( 'wheel',      this.onMouseWheel);

		this._domElement.addEventListener( 'touchstart', this.onTouchStart);
		this._domElement.addEventListener( 'touchend',   this.onPointerUp);
		this._domElement.addEventListener( 'touchcancel',this.onPointerUp);
		this._domElement.addEventListener( 'touchmove',  this.onTouchMove);
	}

	public deactivate()
	{
		this._config.enabled = false;
		this._domElement.removeEventListener( 'mousedown',  this.onMouseDown);
		this._domElement.removeEventListener( 'mousemove',  this.onMouseMove);
		this._domElement.removeEventListener( 'mouseup',    this.onPointerUp);
		this._domElement.removeEventListener( 'mouseleave', this.onPointerUp);
		this._domElement.removeEventListener( 'wheel',      this.onMouseWheel);

		this._domElement.removeEventListener( 'touchstart', this.onTouchStart);
		this._domElement.removeEventListener( 'touchend',   this.onPointerUp);
		this._domElement.removeEventListener( 'touchcancel',this.onPointerUp);
		this._domElement.removeEventListener( 'touchmove',  this.onTouchMove);
	}

	private onTouchStart = (event: TouchEvent) =>
	{
		event.preventDefault();

		if (event.touches.length === 1)
		{
			this._pointer.isDown = true;
		}
		else if (event.touches.length === 2)
		{
			const vec1 = new Vector2(event.touches[0].clientX, event.touches[0].clientY);
			const vec2 = new Vector2(event.touches[1].clientX, event.touches[1].clientY);

			this._pinchDistance.current = vec1.distanceTo(vec2);
		}
	};

	private onTouchMove = (event: TouchEvent) =>
	{
		if (event.touches.length === 1)
		{
			this.rotate(event.touches[0].clientX, event.touches[0].clientY);
		}
		else if (event.touches.length === 2)
		{
			const vec1 = new Vector2(event.touches[0].clientX, event.touches[0].clientY);
			const vec2 = new Vector2(event.touches[1].clientX, event.touches[1].clientY);

			this._pinchDistance.current = vec1.distanceTo(vec2);

			if (this._pinchDistance.previous === null)
			{
				this._pinchDistance.previous = this._pinchDistance.current;
			}
			else
			{
				const deltaDistance = this._pinchDistance.current - this._pinchDistance.previous;

				const delta = deltaDistance*this._config.zoomSpeed / 20;
				this._distance.decreaseEndBy(delta);

				this._pinchDistance.previous = this._pinchDistance.current;
			}
		}
	};

	private onMouseDown = (event: MouseEvent) =>
	{
		event.preventDefault();

		if (event.button === this._mouseButtons.LEFT)
		{
			if (this._config.enableRotate)
			{
				this._pointer.x = event.clientX;
				this._pointer.y = event.clientY;
				this._pointer.isDown = true;
			}
		}
	};

	private onMouseWheel = (event: MouseWheelEvent) =>
	{
		event.preventDefault();
		if (this._config.enableZoom)
		{
			const delta = Math.sign(event.deltaY)*this._config.zoomSpeed;
			this._distance.increaseEndBy(delta);
		}
	};

	private onPointerUp = () =>
	{
		this._pointer.isDown = false;
		this._pointer.x = null;
		this._pointer.y = null;
		this._pointer.prevX = null;
		this._pointer.prevY = null;
		this._pinchDistance.current = this._pinchDistance.previous = null;
	};

	private onMouseMove = (event: MouseEvent) =>
	{
		event.preventDefault();

		if (this._pointer.isDown && this._config.enableRotate)
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
			this.dispatchEvent({type: 'start'});
			const deltaX = THREEMath.degToRad(this._pointer.x - this._pointer.prevX);
			const deltaY = THREEMath.degToRad(this._pointer.y - this._pointer.prevY);

			this._polarAngle.decreaseEndBy(deltaY);
			this._azimuthAngle.decreaseEndBy(deltaX);
		}

		this._pointer.prevX = x;
		this._pointer.prevY = y;
	};

	public get config()
	{
		return this._config;
	}

	public get camera()
	{
		return this._camera;
	}

	public setPosition = (x: number, y: number, z: number, animationDuration: number = 500) =>
	{
		const desiredPos = new Vector3(x, y, z);
		const offset = new Vector3().copy(desiredPos).sub(this._target);
		offset.applyQuaternion(this._quat);

		const spherical = new Spherical();
		spherical.setFromVector3(offset);
		spherical.makeSafe();

		// We have to set it based off the original one, otherwise it can turn around a lot of times, if it has been rotated around before
		const newTheta = Math.round(this._spherical.theta / (2*Math.PI))*2*Math.PI + spherical.theta;
		this._azimuthAngle.setEnd(newTheta);
		this._polarAngle.setEnd(spherical.phi);
		this._distance.setEnd(spherical.radius);
	};

	public setTarget = (x: number, y: number, z: number, animationDuration: number = 500) =>
	{
		this.changePositionSmoothly(this._target, new Vector3(x, y, z), animationDuration);
	};

	public get target()
	{
		return this._target;
	}

	public setDistanceFromTarget = (value: number, transition: boolean = true) =>
	{
		const startValue = transition ? this._distance.start : value;
		this._distance.reset(startValue, value, this._distance.min, value*1.2);
	};

	private changePositionSmoothly = (pos: Vector3, desiredPos: Vector3, animationDuration: number) =>
	{
		const startData = {x: pos.x, y: pos.y, z: pos.z};
		const endData = {x: desiredPos.x, y: desiredPos.y, z: desiredPos.z};

		new TWEEN.Tween(startData)
			.to(endData, animationDuration)
			.easing(TWEEN.Easing.Cubic.Out) // Use an easing function to make the animation smooth.
			.onUpdate(() =>
			{
				pos.set(startData.x, startData.y, startData.z);
			})
			.onComplete(() =>
			{
				pos.set(endData.x, endData.y, endData.z);
			})
			.start();
	};

	public zoomIn = (event?: Event) =>
	{
		this._distance.decreaseEndBy(20);
	};

	public zoomOut = (event?: Event) =>
	{
		this._distance.increaseEndBy(20);
	};

	public update = () =>
	{
		this._distance.update();
		this._azimuthAngle.update();
		this._polarAngle.update();

		this._offset.copy(this._camera.position).sub(this._target);
		this._offset.applyQuaternion(this._quat);

		this._spherical.setFromVector3(this._offset);
		this._spherical.theta = this._azimuthAngle.start;
		this._spherical.phi = this._polarAngle.start;
		this._spherical.makeSafe();
		this._spherical.radius = this._distance.start;

		this._offset.setFromSpherical(this._spherical);
		this._offset.applyQuaternion(this._quatInverse);
		this._camera.position.copy(this._target).add(this._offset);
		this._camera.lookAt(this._target);
	};
}
