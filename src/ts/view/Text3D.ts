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

interface IKerning
{
	first: number; // left char id
	second: number; // right char id
	amount: number;
}

interface IVec2
{
	x: number;
	y: number;
}

interface IQuad
{
	glyph: IChar;
	position: IVec2;
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
	private _instancedMesh: InstancedMesh;

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

	private preprocessText()
	{
		const currentPos = {
			x: 0,
			y: 0
		};

		const scaleCorrection = 0.05;

		const lines: {
			width: number;
			quads: {
				glyph: IChar;
				position: IVec2;
			}[];
		}[] = [];

		let previousGlyph: IChar;
		let maxLineWidth = 0;
		for (const lineOfText of this._textLines)
		{
			currentPos.x = 0;
			previousGlyph = null;

			const quads: IQuad[] = []
			for (let i = 0; i < lineOfText.length; ++i)
			{
				const char = lineOfText[i];

				const glyph = this._glyphs.get(char);
				if (glyph)
				{
					const kerning = previousGlyph ? this.getKerning(previousGlyph.id, glyph.id) : 0;

					previousGlyph = glyph;

					quads.push({
						glyph: glyph,
						position: {
							x: currentPos.x + (glyph.xoffset + kerning) * scaleCorrection,
							y: currentPos.y
						}
					});

					currentPos.x += (glyph.xadvance + kerning) * scaleCorrection;
				}
				else
				{
					console.log(`Unknown char: ${char}`);
				}
			}

			const lineWidth = currentPos.x;
			lines.push({
				quads: quads,
				width: lineWidth
			});
			maxLineWidth = Math.max(maxLineWidth, lineWidth);
			currentPos.y -= this._font.common.lineHeight*scaleCorrection;
		}
	
		return {
			size: {
				x: maxLineWidth,
				y: Math.abs(currentPos.y)
			},
			lines: lines		
		};
	}

	private createGeometry(align: "center" | "left" = "center")
	{
		const allChars = this._textLines.join("").length;
		const geometry = this.createInstancedBufferGeometry(allChars);
		this._instancedMesh = new InstancedMesh(geometry, new MSDFTextShaderMaterial(this._textureAtlas, this._isWebGL2Available), allChars);

		const textObject = this.preprocessText();

		const linePosPointer = {
			x: -textObject.size.x / 2,
			y: textObject.size.y / 2
		};

		const dummy = new Object3D();

		const scaleCorrection = 0.05;
		let counter = 0;
		for (const lineOfText of textObject.lines)
		{
			linePosPointer.x = align === "left" ? -textObject.size.x / 2 : -lineOfText.width / 2;
			for (let i = 0; i < lineOfText.quads.length; ++i)
			{
				const quad = lineOfText.quads[i];
				const glyph = quad.glyph;

				dummy.position.set(linePosPointer.x + quad.position.x, linePosPointer.y + (((this._font.common.lineHeight - glyph.height) - glyph.yoffset - this._font.common.lineHeight) * scaleCorrection), 0);
				dummy.scale.set(glyph.width * scaleCorrection, glyph.height * scaleCorrection, 1);
				dummy.updateMatrix();
				this._instancedMesh.setMatrixAt(counter, dummy.matrix);

				(geometry.attributes.uvOffset as InstancedBufferAttribute).setXY(counter, glyph.x / this._atlasScale.x, (this._atlasScale.y - glyph.y - glyph.height) / this._atlasScale.y);
				(geometry.attributes.uvSize as InstancedBufferAttribute).setXY(counter, glyph.width / this._atlasScale.x, glyph.height / this._atlasScale.y);

				counter++;
			}
			linePosPointer.y -= this._font.common.lineHeight*scaleCorrection;
		}
	}

	public get instancedMesh()
	{
		return this._instancedMesh;
	}
}