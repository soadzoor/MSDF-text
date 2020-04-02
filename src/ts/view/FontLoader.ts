export class FontLoader
{
	private static _fonts: {
		[key: string]: Promise<{}>
	} = {};

	constructor()
	{

	}

	public static async load(url: string)
	{
		if (!this._fonts.url)
		{
			const response = await fetch(url);
			this._fonts.url = await response.json();
		}
		
		return this._fonts.url;
	}
}