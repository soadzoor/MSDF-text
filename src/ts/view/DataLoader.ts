export class DataLoader
{
	public static async loadJSON(url: string)
	{
		const response = await fetch(url);
		const json = await response.json();

		return json;
	}

	public static async loadTXT(url: string)
	{
		const response = await fetch(url);
		const txt = await response.text();

		return txt;
	}
}