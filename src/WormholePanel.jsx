// The "Wormhole" animation from ~/Desktop/luxor-bg/index.html: the Prism gradient (Framer
// University's Animated Gradient Background, built on the Paper Shaders warp shader),
// recolored to Luxor gold and painted on the inside of a tunnel that you fly down. In
// luxor-bg it filled the window; here it fills whatever box it's placed in. Only the
// wormhole is kept; the other tabs, scroll scrubbing and iframes are left out.
import { useLayoutEffect, useRef } from 'react'
import { deckTheme, watchDeckTheme } from './deckTheme.js'
import noise from './assets/noise.png'

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

  wormhole: {
    arms: 3, // the gradient repeats this many times around the tunnel (whole number)
    wrap: 0.4, // how much of the gradient each repeat shows (bigger = more, thinner streaks)
    depth: 1.2, // perspective: bigger = the walls recede faster toward the throat
    speed: 0.35, // how fast you fly forward (negative = backward)
    twist: 1.1, // radians the walls turn per unit of depth: makes the tunnel corkscrew
    spin: 0.08, // rad/s the whole tunnel rotates
    throat: 0.32, // radius of the glowing far end (1 = half the shorter side of the box)
    vignette: 0.55, // how much the corners fade, 0–1
  },

  // The tunnel's streaks are divided by the pixel ratio, so it's fixed at 2 (a Retina screen,
  // where it was tuned in luxor-bg) to look the same at any window size.
  pixelRatio: 2,
  themeTransition: 500, // ms to fade between light and dark

  themes: {
    dark: {
      color1: '#050505', // gradient: empty areas
      color2: '#C9961A', // gradient: main gold
      color3: '#F3DFA2', // gradient: highlights
    },
    light: {
      color1: '#FFFFFF',
      color2: '#C9961A',
      color3: '#8C6A12', // highlights go deeper instead of paler on a light page
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

uniform float u_clock;        // real seconds, independent of the gradient's speed
uniform float u_light;        // 0 = dark theme, 1 = light theme (fades in between)
uniform float u_wormholeArms;
uniform float u_wormholeWrap;
uniform float u_wormholeDepth;
uniform float u_wormholeSpeed;
uniform float u_wormholeTwist;
uniform float u_wormholeSpin;
uniform float u_wormholeThroat;
uniform float u_wormholeVignette;

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

// Distance from the center: 1 = half the shorter side
float wormholeRadius(vec2 fragCoord) {
  return 2. * length(fragCoord - .5 * u_resolution) / min(u_resolution.x, u_resolution.y);
}

// Classic tunnel mapping: each pixel looks at a point on the inside of a tube.
// - depth = 1/radius, so the walls shrink toward the throat in perspective
// - adding the clock to depth flies the camera forward: the walls stream out toward the edges
// To sample the Prism field seamlessly all the way around, walk a circle in it (u_wormholeArms
// times per turn) and slide that circle along the field as depth grows.
vec2 wormhole(vec2 fragCoord) {
  vec2 c = fragCoord - .5 * u_resolution;
  float r = max(wormholeRadius(fragCoord), 1e-3);
  float depth = u_wormholeDepth / r + u_wormholeSpeed * u_clock;
  float angle = u_wormholeArms * (atan(c.y, c.x) + u_wormholeTwist * depth + u_wormholeSpin * u_clock);
  return u_wormholeWrap * vec2(cos(angle), sin(angle)) + vec2(0., depth);
}

vec4 gradient(vec2 fragCoord) {
  float t = .5 * u_time;

  vec2 uv = wormhole(fragCoord);
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
  } else {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  }

  return blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);
}

void main() {
  vec3 color = gradient(gl_FragCoord.xy).rgb;
  // The far end glows (pale gold in dark mode, white in light mode), which also hides the
  // walls where they get too fine to draw. The corners fade to the page color.
  float r = wormholeRadius(gl_FragCoord.xy);
  vec3 light = mix(u_color3.rgb, u_color1.rgb, u_light);
  float glow = 1. - smoothstep(0., u_wormholeThroat, r);
  color = mix(color, light, glow * glow * (3. - 2. * glow));
  color += light * .25 * exp(-r / (.6 * u_wormholeThroat)) * (1. - u_light); // soft halo, dark mode only
  color = mix(color, u_color1.rgb, u_wormholeVignette * smoothstep(.9, 2., r));
  fragColor = vec4(color, 1.);
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
    color1: hex(t.color1),
    color2: hex(t.color2),
    color3: hex(t.color3),
    light: [name === 'light' ? 1 : 0],
  }
}

// The animation's clocks live outside the component so a panel that mounts as another
// unmounts (the explore slide handing over to the Image MCPs reveal) carries on from the
// same frame instead of starting over.
const timeline = {
  totalTime: CONFIG.offset * 10 * 8.333333333333334, // seed → starting time offset (ms), as Paper Shaders does it
  clock: 0, // tunnel clock (ms)
}

const lerp = (a, b, k) =>
  Object.fromEntries(Object.keys(a).map((key) => [key, a[key].map((v, i) => v + (b[key][i] - v) * k)]))

// Fills its parent. Sized from its on-screen box, so it stays sharp at any stage scale.
export default function WormholePanel({ className = '' }) {
  const wrapRef = useRef(null)

  // A layout effect, so the first frame is drawn before the panel is ever painted empty.
  useLayoutEffect(() => {
    // A fresh canvas per mount: its context is released on unmount, and a released
    // context can't be reused (React's dev mode mounts effects twice).
    const canvas = document.createElement('canvas')
    wrapRef.current.prepend(canvas)
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
    // No WebGL2, or the shader failed: the panel just shows its plain background.
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
    const w = c.wormhole
    gl.uniform1f(loc('u_rotation'), (c.rotation * Math.PI) / 180)
    gl.uniform1f(loc('u_proportion'), c.proportion / 100)
    gl.uniform1f(loc('u_scale'), c.scale)
    gl.uniform1f(loc('u_distortion'), c.distortion / 50)
    gl.uniform1f(loc('u_swirl'), c.swirl / 100)
    gl.uniform1f(loc('u_swirlIterations'), c.swirl === 0 ? 0 : c.swirlIterations)
    gl.uniform1f(loc('u_softness'), c.softness / 100)
    gl.uniform1f(loc('u_shape'), c.shape)
    gl.uniform1f(loc('u_shapeScale'), c.shapeSize / 100)
    gl.uniform1f(loc('u_pixelRatio'), c.pixelRatio)
    gl.uniform1f(loc('u_wormholeArms'), Math.round(w.arms))
    gl.uniform1f(loc('u_wormholeWrap'), w.wrap)
    gl.uniform1f(loc('u_wormholeDepth'), w.depth)
    gl.uniform1f(loc('u_wormholeSpeed'), w.speed)
    gl.uniform1f(loc('u_wormholeTwist'), w.twist)
    gl.uniform1f(loc('u_wormholeSpin'), w.spin)
    gl.uniform1f(loc('u_wormholeThroat'), w.throat)
    gl.uniform1f(loc('u_wormholeVignette'), w.vignette)

    // The panel sits inside the scaled stage, so its on-screen size (which includes the
    // stage's scale) sets the canvas resolution. The stage scales on window resize, which
    // a ResizeObserver doesn't see, so listen for that too.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(loc('u_resolution'), width, height)
      // Resizing clears the canvas, so redraw now rather than paint a blank frame.
      draw(performance.now())
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('resize', resize)

    const uploadTheme = (v) => {
      gl.uniform4fv(loc('u_color1'), v.color1)
      gl.uniform4fv(loc('u_color2'), v.color2)
      gl.uniform4fv(loc('u_color3'), v.color3)
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

    let last = performance.now()
    let raf = 0

    function draw(now) {
      const dt = Math.min(now - last, 100) // avoid a jump after the tab was in the background
      last = now
      if (!reduceMotion) {
        timeline.totalTime += dt * c.speed
        timeline.clock += dt
      }
      if (fade) {
        const k = reduceMotion ? 1 : Math.min((now - fade.start) / c.themeTransition, 1)
        current = lerp(fade.from, fade.to, 1 - Math.pow(1 - k, 3)) // ease-out cubic
        uploadTheme(current)
        if (k === 1) fade = null
      }
      gl.uniform1f(loc('u_time'), timeline.totalTime * 0.001)
      gl.uniform1f(loc('u_clock'), timeline.clock * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    function frame(now) {
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    resize()
    // With reduced motion, the frame resize() drew stays (redrawn on theme changes) instead of animating.
    if (!reduceMotion) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      stopWatchingTheme()
      // Free the GPU context now rather than waiting for garbage collection, since the
      // panel mounts again every time you return to its slide.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [])

  return (
    <div ref={wrapRef} className={`wormhole-panel ${className}`} aria-hidden="true">
      {/* Film grain over the gradient, as on the Prism tab in luxor-bg */}
      <div className="wormhole-grain" style={{ backgroundImage: `url(${noise})` }} />
    </div>
  )
}
