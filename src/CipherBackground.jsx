// The "Cipher" background from ~/Desktop/luxor-bg/index.html: the Prism gradient (Framer
// University's Animated Gradient Background, built on the Paper Shaders warp shader),
// recolored to Luxor gold and drawn as scrambling characters. Only the Cipher tab is kept;
// the other tabs, scroll scrubbing and iframes are left out. Everything it needs is in this
// file: the glyphs are drawn at runtime with the system monospace font.
import { useEffect, useRef } from 'react'
import { deckTheme, watchDeckTheme } from './deckTheme.js'

const CONFIG = {
  rotation: -50, // degrees
  proportion: 1, // 0–100
  scale: 0.01,
  speed: 0.1315,
  distortion: 0, // 0–100
  swirl: 50, // 0–100
  swirlIterations: 16,
  softness: 47, // 0–100
  offset: -299, // seed: shifts the starting frame
  shape: 0, // 0 = Checks, 1 = Stripes, 2 = Edge
  shapeSize: 45, // 0–100

  // Character cells, in stage px (the 1280×720 slide), so they scale with the deck
  cellWidth: 9,
  cellHeight: 14,
  // Each cell shows a random character and re-rolls it flipRate times per second (on average)
  chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%&@*+=<>?/{}[]~^!;:',
  flipRate: 1.2,
  font: '700 84px ui-monospace, "SF Mono", Menlo, monospace',
  themeTransition: 500, // ms to fade between light and dark

  themes: {
    dark: {
      background: '#050505', // page color behind the characters
      color1: '#050505', // gradient: empty areas
      color2: '#C9961A', // gradient: main gold
      color3: '#F3DFA2', // gradient: highlights
      baseColor: '#1A1A1A', // dimmest character color, so empty areas are filled too
      brightness: 1.6, // glyphs only cover part of each cell, so push colors to keep the punch
    },
    light: {
      background: '#FFFFFF',
      color1: '#FFFFFF',
      color2: '#C9961A',
      color3: '#8C6A12', // highlights go deeper instead of paler on a light page
      baseColor: '#E6E6E6',
      brightness: 1.2,
    },
  },
}

const VERT = `#version 300 es
layout(location = 0) in vec4 a_position;
void main() { gl_Position = a_position; }
`

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

uniform vec2 u_cell;          // character cell size in device px
uniform float u_flipRate;
uniform float u_clock;        // real seconds, independent of the gradient's speed
uniform float u_brightness;
uniform vec3 u_baseColor;
uniform vec3 u_background;
uniform float u_light;        // 0 = dark theme, 1 = light theme (fades in between)
uniform sampler2D u_glyphs;   // atlas: the character set laid out in a grid
uniform float u_glyphCount;
uniform vec2 u_atlasGrid;     // atlas columns, rows

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;

  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);

  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

vec4 gradient(vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution.xy;

  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  return blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);
}

void main() {
  // Split the canvas into character cells (anchored to the top-left corner)
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 cell = floor(p / u_cell);
  vec2 local = fract(p / u_cell);

  // One gradient sample per cell, taken at its center
  vec2 center = (cell + .5) * u_cell;
  vec3 color = gradient(vec2(center.x, u_resolution.y - center.y)).rgb;

  // Each cell re-rolls its character at its own random rhythm
  float phase = random(cell + 17.31) * 100.;
  float speed = u_flipRate * (.5 + random(cell + 3.7));
  float glyph = min(floor(random(cell + floor(u_clock * speed + phase)) * u_glyphCount), u_glyphCount - 1.);

  // Find that character's slot in the atlas. Explicit gradients keep the mip level
  // steady across cell edges (where local jumps from 1 back to 0).
  vec2 slot = vec2(mod(glyph, u_atlasGrid.x), floor(glyph / u_atlasGrid.x));
  vec2 atlasUv = (slot + local) / u_atlasGrid;
  vec2 gradX = vec2(1. / (u_cell.x * u_atlasGrid.x), 0.);
  vec2 gradY = vec2(0., 1. / (u_cell.y * u_atlasGrid.y));
  float mask = textureGrad(u_glyphs, atlasUv, gradX, gradY).r;
  // Push the color away from the background, then make sure even empty areas
  // are at least as visible as the base color (brighter in dark mode, darker in light mode)
  vec3 pushed = clamp(u_background + (color - u_background) * u_brightness, 0., 1.);
  vec3 digitColor = mix(max(pushed, u_baseColor), min(pushed, u_baseColor), u_light);
  fragColor = vec4(mix(u_background, digitColor, mask), 1.);
}
`

const hex = (h) => {
  h = h.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  if (h.length === 6) h += 'ff'
  return [0, 2, 4, 6].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

const themeVector = (name) => {
  const t = CONFIG.themes[name]
  return {
    background: hex(t.background).slice(0, 3),
    color1: hex(t.color1),
    color2: hex(t.color2),
    color3: hex(t.color3),
    baseColor: hex(t.baseColor).slice(0, 3),
    brightness: [t.brightness],
    light: [name === 'light' ? 1 : 0],
  }
}

const lerp = (a, b, k) =>
  Object.fromEntries(Object.keys(a).map((key) => [key, a[key].map((v, i) => v + (b[key][i] - v) * k)]))

// Fills the whole window behind the slide. `scale` is the deck's stage scale (screen px per
// slide px), so the characters keep the same size relative to the slide. `dim` doubles the
// overlay that tones the animation down.
export default function CipherBackground({ scale, dim = false }) {
  const wrapRef = useRef(null)
  const scaleRef = useRef(scale)
  const resizeRef = useRef(null)
  scaleRef.current = scale

  useEffect(() => {
    // A fresh canvas per mount: its context is released on unmount, and a released
    // context can't be reused (React's dev mode mounts effects twice).
    const canvas = document.createElement('canvas')
    wrapRef.current.appendChild(canvas)
    const gl = canvas.getContext('webgl2')

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }
    const vert = gl && compile(gl.VERTEX_SHADER, VERT)
    const frag = gl && compile(gl.FRAGMENT_SHADER, FRAG)
    const program = vert && frag && gl.createProgram()
    if (program) {
      gl.attachShader(program, vert)
      gl.attachShader(program, frag)
      gl.linkProgram(program)
    }
    // No WebGL2, or the shader failed: the cover just shows its plain background.
    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
      return undefined
    }
    gl.useProgram(program)

    // Fullscreen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const loc = (name) => gl.getUniformLocation(program, name)

    // Same parameter mapping the Framer component applies before handing values to the shader
    const c = CONFIG
    gl.uniform1f(loc('u_rotation'), (c.rotation * Math.PI) / 180)
    gl.uniform1f(loc('u_proportion'), c.proportion / 100)
    gl.uniform1f(loc('u_scale'), c.scale)
    gl.uniform1f(loc('u_distortion'), c.distortion / 50)
    gl.uniform1f(loc('u_swirl'), c.swirl / 100)
    gl.uniform1f(loc('u_swirlIterations'), c.swirl === 0 ? 0 : c.swirlIterations)
    gl.uniform1f(loc('u_softness'), c.softness / 100)
    gl.uniform1f(loc('u_shape'), c.shape)
    gl.uniform1f(loc('u_shapeScale'), c.shapeSize / 100)
    gl.uniform1f(loc('u_flipRate'), c.flipRate)

    // Glyph atlas: each character drawn white on black, in a grid of slots
    const glyphs = [...c.chars]
    const cols = Math.min(glyphs.length, 16)
    const rows = Math.ceil(glyphs.length / cols)
    const slotW = 64
    const slotH = Math.round((64 * c.cellHeight) / c.cellWidth)
    const atlas = document.createElement('canvas')
    atlas.width = slotW * cols
    atlas.height = slotH * rows
    const ctx = atlas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, atlas.width, atlas.height)
    ctx.fillStyle = '#fff'
    ctx.font = c.font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    glyphs.forEach((ch, i) => ctx.fillText(ch, slotW * ((i % cols) + 0.5), slotH * (Math.floor(i / cols) + 0.5)))

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.uniform1i(loc('u_glyphs'), 0)
    gl.uniform1f(loc('u_glyphCount'), glyphs.length)
    gl.uniform2f(loc('u_atlasGrid'), cols, rows)

    // `ratio` is device px per slide px; using it as the pixel ratio keeps the gradient and
    // the cells the same size relative to the slide at any window size.
    let ratio = 0
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      const nextRatio = dpr * scaleRef.current
      if (canvas.width === w && canvas.height === h && ratio === nextRatio) return
      canvas.width = w
      canvas.height = h
      ratio = nextRatio
      gl.viewport(0, 0, w, h)
      gl.uniform2f(loc('u_resolution'), w, h)
      gl.uniform1f(loc('u_pixelRatio'), ratio)
      gl.uniform2f(loc('u_cell'), c.cellWidth * ratio, c.cellHeight * ratio)
    }
    resizeRef.current = resize
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const uploadTheme = (v) => {
      gl.uniform3fv(loc('u_background'), v.background)
      gl.uniform4fv(loc('u_color1'), v.color1)
      gl.uniform4fv(loc('u_color2'), v.color2)
      gl.uniform4fv(loc('u_color3'), v.color3)
      gl.uniform3fv(loc('u_baseColor'), v.baseColor)
      gl.uniform1f(loc('u_brightness'), v.brightness[0])
      gl.uniform1f(loc('u_light'), v.light[0])
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Follow the deck's light/dark mode, fading between them like the original
    let theme = deckTheme()
    let current = themeVector(theme)
    let fade = null
    uploadTheme(current)
    const stopWatchingTheme = watchDeckTheme((next) => {
      if (next === theme) return
      theme = next
      fade = { from: current, to: themeVector(next), start: performance.now() }
      if (reduceMotion) draw(performance.now())
    })

    // Seed → starting time offset (ms), exactly as Paper Shaders does it
    let totalTime = c.offset * 10 * 8.333333333333334
    let clock = 0 // character re-roll clock (ms)
    let last = performance.now()
    let raf = 0

    function draw(now) {
      const dt = Math.min(now - last, 100) // avoid a jump after the tab was in the background
      last = now
      if (!reduceMotion) {
        totalTime += dt * c.speed
        clock += dt
      }
      if (fade) {
        const k = reduceMotion ? 1 : Math.min((now - fade.start) / c.themeTransition, 1)
        current = lerp(fade.from, fade.to, 1 - Math.pow(1 - k, 3)) // ease-out cubic
        uploadTheme(current)
        if (k === 1) fade = null
      }
      gl.uniform1f(loc('u_time'), totalTime * 0.001)
      gl.uniform1f(loc('u_clock'), clock * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    function frame(now) {
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    // With reduced motion, draw one still frame (and redraw on theme changes) instead of animating.
    if (reduceMotion) draw(performance.now())
    else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      resizeRef.current = null
      stopWatchingTheme()
      // Free the GPU context now rather than waiting for garbage collection, since the
      // cover mounts again every time you return to it.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [])

  // The stage scale changes with the window; redraw at the new cell size.
  useEffect(() => {
    resizeRef.current?.()
  }, [scale])

  return <div ref={wrapRef} className={`slide-bg cipher-bg ${dim ? 'dim' : ''}`} aria-hidden="true" />
}
