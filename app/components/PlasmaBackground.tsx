"use client";

import { useRef, useEffect, useCallback } from "react";

// Vertex shader - simple pass-through
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - plasma/aurora effect with brand green
const fragmentShaderSource = `
  precision highp float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_intensity;
  
  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * 0.15;
    
    // Multiple layers of noise for depth
    float n1 = fbm(p * 1.5 + time * 0.3);
    float n2 = fbm(p * 2.0 - time * 0.2 + vec2(5.0, 3.0));
    float n3 = fbm(p * 3.0 + time * 0.4 + vec2(10.0, 7.0));
    
    // Combine noise layers
    float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    
    // Brand green: #C1FF72 = rgb(193, 255, 114) / 255 = (0.757, 1.0, 0.447)
    vec3 brandGreen = vec3(0.757, 1.0, 0.447);
    // Secondary blue accent: subtle
    vec3 accentBlue = vec3(0.231, 0.510, 0.965);
    // Dark background
    vec3 darkBg = vec3(0.059, 0.067, 0.082);
    
    // Create glow centers
    float glow1 = exp(-length(p - vec2(-0.5 + sin(time) * 0.3, 0.3 + cos(time * 0.7) * 0.2)) * 2.0);
    float glow2 = exp(-length(p - vec2(0.6 + cos(time * 0.8) * 0.3, -0.2 + sin(time * 0.5) * 0.2)) * 2.5);
    float glow3 = exp(-length(p - vec2(0.0 + sin(time * 0.6) * 0.4, 0.0 + cos(time * 0.9) * 0.3)) * 1.8);
    
    // Mix colors based on noise and position
    vec3 color = darkBg;
    color += brandGreen * glow1 * (0.3 + noise * 0.2) * u_intensity;
    color += brandGreen * glow3 * (0.2 + noise * 0.15) * u_intensity;
    color += accentBlue * glow2 * 0.15 * u_intensity;
    
    // Add subtle overall plasma effect
    color += brandGreen * (noise * 0.05 + 0.02) * u_intensity;
    
    // Vignette effect
    float vignette = 1.0 - length(uv - 0.5) * 0.8;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface PlasmaBackgroundProps {
  className?: string;
  intensity?: number;
}

export default function PlasmaBackground({ 
  className = "", 
  intensity = 1.0 
}: PlasmaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
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
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { 
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false
    });
    
    if (!gl) {
      console.warn("WebGL not supported, falling back to static background");
      return;
    }

    glRef.current = gl;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    
    programRef.current = program;
    gl.useProgram(program);

    // Create geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");

    // Handle resize
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);

    // Animation loop
    const render = () => {
      if (!gl || !program) return;
      
      const time = (Date.now() - startTimeRef.current) / 1000;
      
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(intensityLocation, intensity);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [createShader, createProgram, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`plasma-background ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
