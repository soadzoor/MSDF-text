import { Convergence } from './Convergence';

export class BoundedConvergence extends Convergence
{
	private _min: number;
	private _max: number;

	constructor(start: number, end: number, min: number, max: number, dampingFactor: number = 0.1)
	{
		super(start, end, dampingFactor);
		this._min = min;
		this._max = max;
	}

	public get min()
	{
		return this._min;
	}

	public get max()
	{
		return this._max;
	}

	public increaseEndBy(value: number)
	{
		this.setEnd(this._end + value);
	}

	public decreaseEndBy(value: number)
	{
		this.setEnd(this._end - value);
	}

	public setEnd(value: number)
	{
		this._end = value;

		if (this._end < this._min)
		{
			this._end = this._min;
		}
		else if (this._end > this._max)
		{
			this._end = this._max;
		}
	}

	public reset(start?: number, end?: number, min?: number, max?: number, dampingFactor?: number)
	{
		this._start = start != null ? start : this._originalStart;
		this._end = end != null ? end : this._originalEnd;
		this._min = min != null ? min : this._min;
		this._max = max != null ? max : this._max;
		this._dampingFactor = dampingFactor != null ? dampingFactor : this._dampingFactor;
	}
}