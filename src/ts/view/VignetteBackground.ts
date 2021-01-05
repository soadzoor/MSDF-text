import { Mesh, PlaneBufferGeometry, RawShaderMaterial, FrontSide, Vector2, Color } from "three";

/**Based on https://github.com/mattdesl/three-vignette-background */

export class VignetteBackground
{
	private _mesh: Mesh;

	constructor(opt: any)
	{
		opt = opt || {};
		const geometry = opt.geometry || new PlaneBufferGeometry(2, 2);
		const material = new RawShaderMaterial({
			vertexShader: "#define GLSLIFY 1\nattribute vec3 position;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nvarying vec2 vUv;\nvoid main() {\n  gl_Position = vec4(position, 1.0);\n  vUv = vec2(position.x, position.y) * 0.5 + 0.5;\n}",
			fragmentShader: "precision mediump float;\n#define GLSLIFY 1\n//\n// GLSL textureless classic 3D noise \"cnoise\",\n// with an RSL-style periodic variant \"pnoise\".\n// Author:  Stefan Gustavson (stefan.gustavson@liu.se)\n// Version: 2011-10-11\n//\n// Many thanks to Ian McEwan of Ashima Arts for the\n// ideas for permutation and gradient selection.\n//\n// Copyright (c) 2011 Stefan Gustavson. All rights reserved.\n// Distributed under the MIT license. See LICENSE file.\n// https://github.com/ashima/webgl-noise\n//\n\nvec3 mod289_1604150559(vec3 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289_1604150559(vec4 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute_1604150559(vec4 x)\n{\n  return mod289_1604150559(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt_1604150559(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec3 fade_1604150559(vec3 t) {\n  return t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\n// Classic Perlin noise, periodic variant\nfloat pnoise_1604150559(vec3 P, vec3 rep)\n{\n  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period\n  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period\n  Pi0 = mod289_1604150559(Pi0);\n  Pi1 = mod289_1604150559(Pi1);\n  vec3 Pf0 = fract(P); // Fractional part for interpolation\n  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0\n  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);\n  vec4 iy = vec4(Pi0.yy, Pi1.yy);\n  vec4 iz0 = Pi0.zzzz;\n  vec4 iz1 = Pi1.zzzz;\n\n  vec4 ixy = permute_1604150559(permute_1604150559(ix) + iy);\n  vec4 ixy0 = permute_1604150559(ixy + iz0);\n  vec4 ixy1 = permute_1604150559(ixy + iz1);\n\n  vec4 gx0 = ixy0 * (1.0 / 7.0);\n  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;\n  gx0 = fract(gx0);\n  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);\n  vec4 sz0 = step(gz0, vec4(0.0));\n  gx0 -= sz0 * (step(0.0, gx0) - 0.5);\n  gy0 -= sz0 * (step(0.0, gy0) - 0.5);\n\n  vec4 gx1 = ixy1 * (1.0 / 7.0);\n  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;\n  gx1 = fract(gx1);\n  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);\n  vec4 sz1 = step(gz1, vec4(0.0));\n  gx1 -= sz1 * (step(0.0, gx1) - 0.5);\n  gy1 -= sz1 * (step(0.0, gy1) - 0.5);\n\n  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);\n  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);\n  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);\n  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);\n  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);\n  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);\n  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);\n  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);\n\n  vec4 norm0 = taylorInvSqrt_1604150559(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));\n  g000 *= norm0.x;\n  g010 *= norm0.y;\n  g100 *= norm0.z;\n  g110 *= norm0.w;\n  vec4 norm1 = taylorInvSqrt_1604150559(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));\n  g001 *= norm1.x;\n  g011 *= norm1.y;\n  g101 *= norm1.z;\n  g111 *= norm1.w;\n\n  float n000 = dot(g000, Pf0);\n  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));\n  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));\n  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));\n  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));\n  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));\n  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));\n  float n111 = dot(g111, Pf1);\n\n  vec3 fade_xyz = fade_1604150559(Pf0);\n  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);\n  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);\n  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);\n  return 2.2 * n_xyz;\n}\n\n//\n// Description : Array and textureless GLSL 2D/3D/4D simplex\n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//\n\nvec3 mod289_1117569599(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289_1117569599(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute_1117569599(vec4 x) {\n     return mod289_1117569599(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt_1117569599(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nfloat snoise_1117569599(vec3 v)\n  {\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D_1117569599 = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g_1117569599 = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g_1117569599;\n  vec3 i1 = min( g_1117569599.xyz, l.zxy );\n  vec3 i2 = max( g_1117569599.xyz, l.zxy );\n\n  //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n  //   x1 = x0 - i1  + 1.0 * C.xxx;\n  //   x2 = x0 - i2  + 2.0 * C.xxx;\n  //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D_1117569599.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289_1117569599(i);\n  vec4 p = permute_1117569599( permute_1117569599( permute_1117569599(\n             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n  float n_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n_ * D_1117569599.wyz - D_1117569599.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1_1117569599 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0_1117569599 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1_1117569599.xy,h.z);\n  vec3 p3 = vec3(a1_1117569599.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt_1117569599(vec4(dot(p0_1117569599,p0_1117569599), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0_1117569599 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m * m;\n  return 42.0 * dot( m*m, vec4( dot(p0_1117569599,x0), dot(p1,x1),\n                                dot(p2,x2), dot(p3,x3) ) );\n  }\n\nfloat grain_2281831123(vec2 texCoord, vec2 resolution, float frame, float multiplier) {\n    vec2 mult = texCoord * resolution;\n    float offset = snoise_1117569599(vec3(mult / multiplier, frame));\n    float n1 = pnoise_1604150559(vec3(mult, offset), vec3(1.0/texCoord * resolution, 1.0));\n    return n1 / 2.0 + 0.5;\n}\n\nfloat grain_2281831123(vec2 texCoord, vec2 resolution, float frame) {\n    return grain_2281831123(texCoord, resolution, frame, 2.5);\n}\n\nfloat grain_2281831123(vec2 texCoord, vec2 resolution) {\n    return grain_2281831123(texCoord, resolution, 0.0);\n}\n\nvec3 blendSoftLight_1540259130(vec3 base, vec3 blend) {\n    return mix(\n        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend), \n        2.0 * base * blend + base * base * (1.0 - 2.0 * blend), \n        step(base, vec3(0.5))\n    );\n}\n\n// Using conditionals\n// vec3 blendSoftLight(vec3 base, vec3 blend) {\n//     return vec3(\n//         ((blend.r < 0.5) ? (2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r)) : (sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r))),\n//         ((blend.g < 0.5) ? (2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g)) : (sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g))),\n//         ((blend.b < 0.5) ? (2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b)) : (sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b)))\n//     );\n// }\n\nuniform vec3 color1;\nuniform vec3 color2;\nuniform float aspect;\nuniform vec2 offset;\nuniform vec2 scale;\nuniform float noiseAlpha;\nuniform bool aspectCorrection;\nuniform float grainScale;\nuniform float grainTime;\nuniform vec2 smooth;\n\nvarying vec2 vUv;\n\nvoid main() {\n  vec2 q = vec2(vUv - 0.5);\n  if (aspectCorrection) {\n    q.x *= aspect;\n  }\n  q /= scale;\n  q -= offset;\n  float dst = length(q);\n  dst = smoothstep(smooth.x, smooth.y, dst);\n  vec3 color = mix(color1, color2, dst);\n  \n  if (noiseAlpha > 0.0 && grainScale > 0.0) {\n    float gSize = 1.0 / grainScale;\n    float g = grain_2281831123(vUv, vec2(gSize * aspect, gSize), grainTime);\n    vec3 noiseColor = blendSoftLight_1540259130(color, vec3(g));\n    gl_FragColor.rgb = mix(color, noiseColor, noiseAlpha);\n  } else {\n    gl_FragColor.rgb = color;\n  }\n  gl_FragColor.a = 1.0;\n}",
			side: FrontSide,
			uniforms: {
				aspectCorrection: { value: false },
				aspect: { value: 1 },
				grainScale: { value: 0.005 },
				grainTime: { value: 0 },
				noiseAlpha: { value: 0.25 },
				offset: { value: new Vector2(0, 0) },
				scale: { value: new Vector2(1, 1) },
				smooth: { value: new Vector2(0.0, 1.0) },
				color1: { value: new Color('#fff') },
				color2: { value: new Color('#283844') }
			},
			depthTest: false
		});
		const mesh = new Mesh(geometry, material) as any;
		mesh.frustumCulled = false;
		mesh.style = style;
		if (opt)
		{
			mesh.style(opt);
		}
		this._mesh = mesh;

		function style(opt)
		{
			opt = opt || {};
			if (Array.isArray(opt.colors))
			{
				const colors = opt.colors.map(function (c)
				{
					if (typeof c === 'string' || typeof c === 'number')
					{
						return new Color(<number>c)
					}
					return c
				});
				material.uniforms.color1.value.copy(colors[0]);
				material.uniforms.color2.value.copy(colors[1]);
			}
			if (typeof opt.aspect === 'number')
			{
				material.uniforms.aspect.value = opt.aspect;
			}
			if (typeof opt.grainScale === 'number')
			{
				material.uniforms.grainScale.value = opt.grainScale;
			}
			if (typeof opt.grainTime === 'number')
			{
				material.uniforms.grainTime.value = opt.grainTime;
			}
			if (opt.smooth)
			{
				var smooth = fromArray(opt.smooth, Vector2);
				material.uniforms.smooth.value.copy(smooth);
			}
			if (opt.offset)
			{
				var offset = fromArray(opt.offset, Vector2);
				material.uniforms.offset.value.copy(offset);
			}
			if (typeof opt.noiseAlpha === 'number')
			{
				material.uniforms.noiseAlpha.value = opt.noiseAlpha;
			}
			if (typeof opt.scale !== 'undefined')
			{
				var scale = opt.scale;
				if (typeof scale === 'number')
				{
					scale = [ scale, scale ];
				}
				scale = fromArray(scale, Vector2);
				material.uniforms.scale.value.copy(scale);
			}
			if (typeof opt.aspectCorrection !== 'undefined')
			{
				material.uniforms.aspectCorrection.value = Boolean(opt.aspectCorrection);
			}
		}

		const fromArray = (array, VectorType) =>
		{
			if (Array.isArray(array))
			{
				return new VectorType().fromArray(array);
			}
			return array;
		}
	}

	public get mesh()
	{
		return this._mesh;
	}
}