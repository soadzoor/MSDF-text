import {RawShaderMaterial, Shader, Texture} from "three";

export class SDFTextShader extends RawShaderMaterial
{
	private _textureAtlas: {
		type: "t",
		value: Texture
	};

	private _vertexShader: string = 
`precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main()
{
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

	private _fragmentShader: string =
`#ifdef GL_OES_standard_derivatives
	#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

varying vec2 vUv;

uniform sampler2D map;

float threshold = 0.5;
float smoothing = 0.05;

float median(float r, float g, float b)
{
	return max(min(r, g), min(max(r, g), b));
}

void main()
{
	vec2 uv = vUv;
	// show "j" only
	// vec2 uv = (vUv * vec2(0.029296875, 0.0859375)) + vec2(0.02734375, 0.822265625);
	vec3 font = texture2D(map, uv).rgb;
	float sigDist = median(font.r, font.g, font.b) - 0.5;
	float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
	gl_FragColor = vec4(0, 0, 0, alpha);
}
`;
	constructor(textureAtlas: Texture, isWebGL2: boolean)
	{
		super({transparent: true});

		if (isWebGL2)
		{
			this._vertexShader = `#version 300 es\n${this._vertexShader}`
			.replace(/varying/g, "out")
			.replace(/attribute/g, "in");

			this._fragmentShader = `#version 300 es\n${this._fragmentShader}`
			.replace(/varying/g, "in").replace(/texture2D/g, "texture").
			replace(/precision highp float;/, `precision highp float;\nout vec4 outputColor;`)
			.replace(/gl_FragColor/g, "outputColor");
		}

		this._textureAtlas = {
			type: "t",
			value: textureAtlas
		};

		this.onBeforeCompile = (shader: Shader) =>
		{
			shader.vertexShader = this._vertexShader;
			shader.fragmentShader = this._fragmentShader;

			shader.uniforms = {
				map: this._textureAtlas
			} as any;
		};
	}
}