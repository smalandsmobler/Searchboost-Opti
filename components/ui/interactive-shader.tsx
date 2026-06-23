"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

// --- Types ---

interface ShaderParams {
  hue: number;
  speed: number;
  intensity: number;
  complexity: number;
}

interface ControlSliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: string;
  max: string;
  step: string;
}

// --- Custom Hooks ---

/**
 * Throttles a callback to at most once per `delay` ms.
 * Keeps the animation loop from being overwhelmed by mousemove events.
 */
function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!timeoutRef.current) {
        callbackRef.current(...args);
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
        }, delay);
      }
    },
    [delay]
  ) as T;
}

/**
 * Encapsulates all WebGL shader setup, the render loop, and cleanup.
 */
function useShaderAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  params: ShaderParams
) {
  const { hue, speed, intensity, complexity } = params;
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mousePos.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }, [canvasRef]);

  const throttledMouseMove = useThrottledCallback(handleMouseMove, 16);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl2") as WebGLRenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.error("WebGL not supported.");
      return;
    }

    // --- GLSL Shaders ---
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_hue;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_complexity;

      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
      }

      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 10; i++) {
          if (float(i) >= u_complexity) break;
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float t = u_time * u_speed * 0.1;
        float mouse_dist = distance(uv, u_mouse);
        float warp = smoothstep(0.5, 0.0, mouse_dist) * 0.5;
        vec2 p = uv * 2.0 + vec2(t, t * 0.5) + warp;
        float noise_pattern = fbm(p);
        float vignette = 1.0 - smoothstep(0.8, 1.5, length(uv));
        float saturation = 0.6 + noise_pattern * 0.4;
        float value = 0.2 + (noise_pattern * 0.8) * u_intensity * vignette;
        vec3 color = hsv2rgb(vec3(u_hue / 360.0, saturation, value));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // --- Compile helpers ---
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution   = gl.getUniformLocation(program, "u_resolution");
    const uTime         = gl.getUniformLocation(program, "u_time");
    const uMouse        = gl.getUniformLocation(program, "u_mouse");
    const uHue          = gl.getUniformLocation(program, "u_hue");
    const uSpeed        = gl.getUniformLocation(program, "u_speed");
    const uIntensity    = gl.getUniformLocation(program, "u_intensity");
    const uComplexity   = gl.getUniformLocation(program, "u_complexity");

    // --- Render loop ---
    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
      gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(uTime, (performance.now() - startTime) * 0.001);
      gl.uniform2f(uMouse, mousePos.current.x, mousePos.current.y);
      gl.uniform1f(uHue, hue);
      gl.uniform1f(uSpeed, speed);
      gl.uniform1f(uIntensity, intensity);
      gl.uniform1f(uComplexity, complexity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    window.addEventListener("mousemove", throttledMouseMove as EventListener);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", throttledMouseMove as EventListener);
      if (gl && !gl.isContextLost()) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [hue, speed, intensity, complexity, canvasRef, throttledMouseMove]);
}

// --- Sub-components ---

const ControlSlider = React.memo<ControlSliderProps>(
  ({ label, value, onChange, min, max, step }) => (
    <div className="flex flex-col text-white">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium select-none">{label}</label>
        <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full select-none">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  )
);
ControlSlider.displayName = "ControlSlider";

const ShaderCanvas = React.memo<ShaderParams>(({ hue, speed, intensity, complexity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useShaderAnimation(canvasRef, { hue, speed, intensity, complexity });
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
});
ShaderCanvas.displayName = "ShaderCanvas";

// --- Main component ---

const InteractiveShader = () => {
  const [hue,        setHue]        = useState(210);
  const [speed,      setSpeed]      = useState(0.4);
  const [intensity,  setIntensity]  = useState(1.2);
  const [complexity, setComplexity] = useState(5.0);

  const handleHue        = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setHue(parseFloat(e.target.value)), []);
  const handleSpeed      = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSpeed(parseFloat(e.target.value)), []);
  const handleIntensity  = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setIntensity(parseFloat(e.target.value)), []);
  const handleComplexity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setComplexity(parseFloat(e.target.value)), []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
      <ShaderCanvas hue={hue} speed={speed} intensity={intensity} complexity={complexity} />

      {/* Overlay title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-5xl md:text-8xl font-bold text-white mix-blend-overlay select-none">
          Interactive Shader
        </h1>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div className="bg-black/50 backdrop-blur-md p-6 rounded-2xl shadow-lg space-y-4 border border-white/10">
          <ControlSlider label="Hue"        value={hue}        onChange={handleHue}        min="0"   max="360"  step="1"    />
          <ControlSlider label="Speed"      value={speed}      onChange={handleSpeed}      min="0.0" max="2.0"  step="0.01" />
          <ControlSlider label="Intensity"  value={intensity}  onChange={handleIntensity}  min="0.1" max="3.0"  step="0.01" />
          <ControlSlider label="Complexity" value={complexity} onChange={handleComplexity} min="1.0" max="10.0" step="0.1"  />
        </div>
      </div>
    </div>
  );
};

export default InteractiveShader;
