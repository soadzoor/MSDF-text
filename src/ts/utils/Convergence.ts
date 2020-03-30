/** This class is mainly for animating anything seamlessly and smoothly.
 *  If you modify the "end", end you keep calling "update", then start will get closer and closer to the value of "end"
 *  The higher the dampingFactor is, the faster the "animation" is. It should be between 0 and 1.*/

export class Convergence
{
	protected _originalStart: number;
	protected _originalEnd: number;
	protected _start: number;
	protected _end: number;
	protected _dampingFactor: number;

	constructor(start: number, end: number, dampingFactor: number = 0.1)
	{
		this._originalStart = start;
		this._start = start;
		this._originalEnd = end;
		this._end = end;
		this._dampingFactor = dampingFactor;
	}

	public increaseEndBy(value: number)
	{
		this._end += value;
	}

	public decreaseEndBy(value: number)
	{
		this._end -= value;
	}

	public get start()
	{
		return this._start;
	}

	public get end()
	{
		return this._end;
	}

	public setEnd(value: number)
	{
		this._end = value;
	}

	public reset(start?: number, end?: number)
	{
		this._start = start != null ? start : this._originalStart;
		this._end = end != null ? end : this._originalEnd;
	}

	public update = () =>
	{
		this._start += (this._end - this._start) * this._dampingFactor
	}
}