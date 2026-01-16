"use client";

import { useRef, useEffect, useCallback } from "react";

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - Neural Network + Ocean Waves with mouse interaction
const fragmentShaderSource = `
  precision highp float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_mouseActive;
  uniform float u_intensity;
  uniform float u_scrollProgress;
  
  #define PI 3.14159265359
  #define NUM_NODES 12
  
  // Simplex noise helper functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
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
  
  // Fractional Brownian Motion for organic waves
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Ocean wave function
  float oceanWave(vec2 p, float time, vec2 mouse, float mouseActive) {
    float wave = 0.0;
    
    // Base ocean waves
    wave += sin(p.x * 2.0 + time * 0.5) * 0.15;
    wave += sin(p.x * 4.0 - time * 0.3 + p.y * 2.0) * 0.1;
    wave += sin(p.y * 3.0 + time * 0.4) * 0.12;
    
    // Noise-based turbulence
    wave += fbm(p * 1.5 + time * 0.1) * 0.2;
    
    // Mouse ripple effect
    if (mouseActive > 0.5) {
      float dist = length(p - mouse);
      float ripple = sin(dist * 15.0 - time * 4.0) * exp(-dist * 2.0);
      wave += ripple * 0.3 * mouseActive;
    }
    
    return wave;
  }
  
  // Neural network node positions (pseudo-random but deterministic)
  vec2 getNodePosition(int id, float time) {
    float fi = float(id);
    float angle = fi * 2.399963 + time * 0.1; // Golden angle
    float radius = 0.3 + 0.4 * fract(fi * 0.618);
    vec2 base = vec2(cos(angle), sin(angle)) * radius;
    
    // Add subtle floating motion
    base.x += sin(time * 0.3 + fi) * 0.05;
    base.y += cos(time * 0.25 + fi * 1.3) * 0.05;
    
    return base;
  }
  
  // Draw neural connection line
  float drawConnection(vec2 p, vec2 a, vec2 b, float thickness) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    return smoothstep(thickness, thickness * 0.3, d);
  }
  
  // Draw neural node
  float drawNode(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    float glow = exp(-d * 8.0 / radius);
    float core = smoothstep(radius, radius * 0.5, d);
    return core * 0.8 + glow * 0.5;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= u_resolution.x / u_resolution.y;
    
    // Mouse in normalized coordinates
    vec2 mouse = (u_mouse / u_resolution.xy - 0.5) * 2.0;
    mouse.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * 0.5;
    
    // Brand green: #C1FF72 = rgb(193, 255, 114)
    vec3 brandGreen = vec3(0.757, 1.0, 0.447);
    vec3 darkBg = vec3(0.059, 0.067, 0.082);
    vec3 accentCyan = vec3(0.2, 0.6, 0.9);
    
    // === OCEAN LAYER ===
    float ocean = oceanWave(p, time, mouse, u_mouseActive);
    
    // Ocean coloring with depth
    vec3 oceanColor = mix(darkBg, brandGreen * 0.3, ocean * 0.5 + 0.5);
    oceanColor += brandGreen * (ocean * 0.2 + 0.05) * u_intensity;
    
    // === NEURAL NETWORK LAYER ===
    float networkAlpha = 0.0;
    vec3 networkColor = vec3(0.0);
    
    // Draw connections between nearby nodes
    for (int i = 0; i < NUM_NODES; i++) {
      vec2 nodeA = getNodePosition(i, time);
      
      // GLSL ES requires constant loop initialization, so start at 0 and skip if j <= i
      for (int j = 0; j < NUM_NODES; j++) {
        if (j <= i) continue;
        
        vec2 nodeB = getNodePosition(j, time);
        float dist = length(nodeA - nodeB);
        
        // Only connect nearby nodes
        if (dist < 0.6) {
          float connectionStrength = 1.0 - dist / 0.6;
          float line = drawConnection(p, nodeA, nodeB, 0.008);
          
          // Pulse along the connection
          float pulse = sin(time * 2.0 + float(i + j) * 0.5) * 0.5 + 0.5;
          
          networkAlpha += line * connectionStrength * 0.3 * (0.5 + pulse * 0.5);
          networkColor += brandGreen * line * connectionStrength * pulse * 0.5;
        }
      }
    }
    
    // Draw nodes
    for (int i = 0; i < NUM_NODES; i++) {
      vec2 nodePos = getNodePosition(i, time);
      float nodeGlow = drawNode(p, nodePos, 0.04);
      
      // Mouse interaction - nodes are attracted slightly
      if (u_mouseActive > 0.5) {
        float distToMouse = length(nodePos - mouse);
        if (distToMouse < 0.5) {
          nodeGlow *= 1.0 + (0.5 - distToMouse) * u_mouseActive;
        }
      }
      
      networkAlpha += nodeGlow * 0.4;
      networkColor += brandGreen * nodeGlow * 0.6;
      networkColor += accentCyan * nodeGlow * 0.2;
    }
    
    // === COMBINE LAYERS ===
    vec3 color = oceanColor;
    color += networkColor * u_intensity;
    
    // Add glow around mouse position
    if (u_mouseActive > 0.5) {
      float mouseGlow = exp(-length(p - mouse) * 3.0) * u_mouseActive;
      color += brandGreen * mouseGlow * 0.3;
    }
    
    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.6;
    color *= vignette;
    
    // Apply scroll progress fade if needed
    color = mix(color, darkBg, u_scrollProgress);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface NeuralOceanBackgroundProps {
  className?: string;
  intensity?: number;
  scrollProgress?: number;
}

export default function NeuralOceanBackground({
  className = "",
  intensity = 1.0,
  scrollProgress = 0.0
}: NeuralOceanBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef<{ x: number; y: number; active: number }>({ x: 0, y: 0, active: 0 });
  const uniformsRef = useRef<{
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    mouseActive: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
    scrollProgress: WebGLUniformLocation | null;
  }>({
    time: null,
    resolution: null,
    mouse: null,
    mouseActive: null,
    intensity: null,
    scrollProgress: null,
  });

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
      console.warn("WebGL not supported");
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

    // Create geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    uniformsRef.current = {
      time: gl.getUniformLocation(program, "u_time"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      mouseActive: gl.getUniformLocation(program, "u_mouseActive"),
      intensity: gl.getUniformLocation(program, "u_intensity"),
      scrollProgress: gl.getUniformLocation(program, "u_scrollProgress"),
    };

    // Handle resize
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      mouseRef.current.x = (e.clientX - rect.left) * dpr;
      mouseRef.current.y = (canvas.height) - (e.clientY - rect.top) * dpr;
      mouseRef.current.active = 1.0;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = 0.0;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Animation loop
    const render = () => {
      if (!gl || !program) return;

      const time = (Date.now() - startTimeRef.current) / 1000;
      const uniforms = uniformsRef.current;

      gl.uniform1f(uniforms.time, time);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.mouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uniforms.mouseActive, mouseRef.current.active);
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform1f(uniforms.scrollProgress, scrollProgress);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [createShader, createProgram, intensity, scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={`neural-ocean-background ${className}`}
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
