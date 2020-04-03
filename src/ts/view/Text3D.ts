import {InstancedBufferGeometry, BufferAttribute, InstancedBufferAttribute, Object3D, InstancedMesh, Texture, BufferGeometry, Mesh} from "three";
import {MSDFTextShaderMaterial} from "./MSDFTextShaderMaterial";

interface IChar
{
	id: number;
	index: number;
	char: string;
	width: number;
	height: number;
	xoffset: number;
	yoffset: number;
	xadvance: number;
	chnl: number;
	x: number;
	y: number;
	page: number;
}

interface IKerning
{
	first: number; // left char id
	second: number; // right char id
	amount: number;
}

export interface IFont
{
	common: {
		lineHeight: number;
		base: number;
		scaleW: number;
		scaleH: number;
	};
	chars: IChar[];
	kernings: IKerning[];
}

export class Text3D
{
	private _font: IFont;
	private _config = {
		lineHeight: 1,
		spaceSize: 0.5
	};
	private _atlasScale: {
		x: number;
		y: number;
	};
	private _glyphs: Map<string, IChar> = new Map();
	private _textLines: string[]; // lines of textLines
	private _textureAtlas: Texture;
	private _isWebGL2Available: boolean;
	private _mesh: Mesh;

	constructor(font: IFont, textLines: string[], textureAtlas: Texture, isWebGL2Available: boolean)
	{
		this._font = font;
		this.parseFont(this._font);
		this._textLines = textLines;
		this._textureAtlas = textureAtlas;
		this._isWebGL2Available = isWebGL2Available;

		this.createGeometry();
	}

	private parseFont(font: IFont)
	{
		this._atlasScale = {
			x: font.common.scaleW,
			y: font.common.scaleH
		};

		for (const char of font.chars)
		{
			if (!this._glyphs.get(char.char))
			{
				this._glyphs.set(char.char, char);
			}
		}
	}

	private getKerning(leftCharID: number, rightCharID: number)
	{
		for (const kerning of this._font.kernings)
		{
			if (kerning.first === leftCharID && kerning.second === rightCharID)
			{
				return kerning.amount;
			}
		}

		return 0;
	}

	private createBufferGeometry(charCount: number)
	{
		const geometry = new BufferGeometry();
		const positions = new Float32Array(charCount*4*3);

		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		const uvs = new Float32Array(charCount*4*2);
		geometry.setAttribute("uv", new BufferAttribute(uvs, 2));

		const indeces = [];
		for (let i = 0; i < charCount; ++i)
		{
			indeces.push(i*4); indeces.push(i*4 + 1); indeces.push(i*4 + 2);
			indeces.push(i*4); indeces.push(i*4 + 2); indeces.push(i*4 + 3);
		}
		
		geometry.setIndex(new BufferAttribute(new Uint8Array(indeces), 1));

		return geometry;
	}

	private createGeometry()
	{
		const allChars = this._textLines.join("").length;
		const geometry = this.createBufferGeometry(allChars);
		this._mesh = new Mesh(geometry, new MSDFTextShaderMaterial(this._textureAtlas, this._isWebGL2Available));

		const currentPos = {
			x: 0,
			y: 0
		};

		const scaleCorrection = 0.05;
		let previousGlyph: IChar = null;
		let counter = 0;

		// pos and uv
		const attribs = [
			0, 0, 0,
			1, 0, 0,
			1, 1, 0,
			0, 1, 0
		];
		const positionItemSize = 3;
		const attribElementCount = attribs.length / positionItemSize;

		for (const lineOfText of this._textLines)
		{
			currentPos.x = 0;
			for (let i = 0; i < lineOfText.length; ++i)
			{
				const char = lineOfText[i];
	
				const glyph = this._glyphs.get(char);
				if (glyph)
				{
					const kerning = previousGlyph ? this.getKerning(previousGlyph.id, glyph.id) : 0;

					const positionAttrib = (geometry.attributes.position as BufferAttribute);
					const uvAttrib = (geometry.attributes.uv as BufferAttribute);
					const bottomLeft = {
						x: currentPos.x + (glyph.xoffset + kerning) * scaleCorrection,
						y: currentPos.y + (((this._font.common.lineHeight - glyph.height) - glyph.yoffset) * scaleCorrection)
					};

					const scale = {
						x: glyph.width * scaleCorrection,
						y: glyph.height * scaleCorrection
					};

					const uvSize = {
						x: glyph.width / this._atlasScale.x,
						y: glyph.height / this._atlasScale.y
					};

					for (let k = 0; k < attribElementCount; ++k)
					{
						positionAttrib.setXYZ(
							counter*4 + k,
							bottomLeft.x + attribs[k*positionItemSize + 0] * scale.x,
							bottomLeft.y + attribs[k*positionItemSize + 1] * scale.y,
							0
						);

						uvAttrib.setXY(
							counter * 4 + k,
							(glyph.x / this._atlasScale.x) + attribs[k*positionItemSize + 0] * uvSize.x,
							((this._atlasScale.y - glyph.y - glyph.height) / this._atlasScale.y) + attribs[k*positionItemSize + 1] * uvSize.y,
						)
					}

					currentPos.x += (glyph.xadvance + kerning) * scaleCorrection;
					counter++;
					previousGlyph = glyph;
				}
				else
				{
					console.log(`Unknown char: ${char}`);
				}
			}
			currentPos.y -= this._font.common.lineHeight*scaleCorrection;
		}
	}

	public get mesh()
	{
		return this._mesh;
	}
}