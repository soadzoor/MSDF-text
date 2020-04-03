import {InstancedBufferGeometry, BufferAttribute, InstancedBufferAttribute, Object3D, InstancedMesh, Texture} from "three";
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

export interface IFont
{
	common: {
		lineHeight: number;
		base: number;
		scaleW: number;
		scaleH: number;
	};
	chars: IChar[];
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
	private _text: string;
	private _textureAtlas: Texture;
	private _isWebGL2Available: boolean;
	private _instancedMesh: InstancedMesh;

	constructor(font: IFont, text: string, textureAtlas: Texture, isWebGL2Available: boolean)
	{
		this._font = font;
		this.parseFont(this._font);
		this._text = text;
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

	private createInstancedBufferGeometry(charCount: number)
	{
		const geometry = new InstancedBufferGeometry();
		const positions = new Float32Array([
			0, 0, 0,
						1, 0, 0,
						1, 1, 0,
						0, 1, 0
		]);

		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		const uvs = new Float32Array([
			0, 0,
			1, 0,
			1, 1,
			0, 1
		]);
		geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
		
		geometry.setIndex(new BufferAttribute(new Uint8Array([
			0, 1, 2,
			0, 2, 3
		]), 1));

		geometry.setAttribute("uvOffset", new InstancedBufferAttribute(new Float32Array(charCount * 2), 2));
		geometry.setAttribute("uvSize", new InstancedBufferAttribute(new Float32Array(charCount * 2), 2));

		return geometry;
	}

	private createGeometry()
	{
		const geometry = this.createInstancedBufferGeometry(this._text.length);
		this._instancedMesh = new InstancedMesh(geometry, new MSDFTextShaderMaterial(this._textureAtlas, this._isWebGL2Available), this._text.length);

		const currentPos = {
			x: 0,
			y: 0
		};

		const dummy = new Object3D();

		const scaleCorrection = 0.05;

		for (let i = 0; i < this._text.length; ++i)
		{
			const char = this._text[i];

			const glyph = this._glyphs.get(char);
			if (glyph)
			{
				dummy.position.set(currentPos.x + glyph.xoffset * scaleCorrection, currentPos.y + (((this._font.common.lineHeight - glyph.height) - glyph.yoffset) * scaleCorrection), 0);
				dummy.scale.set(glyph.width * scaleCorrection, glyph.height * scaleCorrection, 1);
				dummy.updateMatrix();
				this._instancedMesh.setMatrixAt(i, dummy.matrix);

				(geometry.attributes.uvOffset as InstancedBufferAttribute).setXY(i, glyph.x / this._atlasScale.x, (this._atlasScale.y - glyph.y - glyph.height) / this._atlasScale.y);
				(geometry.attributes.uvSize as InstancedBufferAttribute).setXY(i, glyph.width / this._atlasScale.x, glyph.height / this._atlasScale.y);
				//(geometry.attributes.uvOffset as InstancedBufferAttribute).needsUpdate = true;

				currentPos.x += glyph.xadvance*scaleCorrection;
			}
			else
			{
				console.log(`Unknown char: ${char}`);
			}
		}

	}

	public get instancedMesh()
	{
		return this._instancedMesh;
	}
}