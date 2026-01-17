"use client";

import { useRef, useEffect, useCallback, useState } from "react";

/**
 * PLASMA OCEAN NEURAL FIELD
 * 
 * A 3-layer interactive background effect:
 * 1. Ocean motion base - smooth wave displacement + specular lighting
 * 2. Plasma energy overlay - glowing turbulence / nebula flow
 * 3. Neural network mesh - nodes + connections with parallax
 * 
 * Interactions:
 * - Hover/drag: field bends away from pointer (magnetic disturbance)
 * - Click/tap: ripple shockwave + glow boost + neural pulse
 * 
 * CONFIG (adjust at bottom of shader):
 * - OCEAN_SPEED: Wave movement speed
 * - PLASMA_INTENSITY: Glow strength
 * - MESH_DENSITY: Number of neural nodes
 * - RIPPLE_STRENGTH: Click ripple intensity
 */

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_mouseActive;
  uniform float u_clickTime;
  uniform vec2 u_clickPos;
  uniform float u_intensity;
  
  // === CONFIG - ADJUST THESE ===
  #define OCEAN_SPEED 0.3
  #define OCEAN_SCALE 2.5
  #define PLASMA_INTENSITY 0.7
  #define MESH_NODE_COUNT 8
  #define RIPPLE_STRENGTH 0.4
  #define RIPPLE_SPEED 2.5
  
  #define PI 3.14159265359
  
  // Hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  // Smooth value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  
  // FBM for organic patterns
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Domain warping for fluid motion
  vec2 warp(vec2 p, float time) {
    vec2 q = vec2(
      fbm(p + time * 0.1, 4),
      fbm(p + vec2(5.2, 1.3) + time * 0.12, 4)
    );
    return vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + time * 0.08, 4),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.1, 4)
    );
  }
  
  // === LAYER 1: OCEAN BASE ===
  float oceanLayer(vec2 uv, float time, vec2 mouseInfluence) {
    vec2 p = uv * OCEAN_SCALE;
    
    // Apply mouse distortion (magnetic repulsion)
    p += mouseInfluence * 0.3;
    
    // Layered waves
    float wave1 = sin(p.x * 3.0 + time * OCEAN_SPEED) * cos(p.y * 2.0 + time * OCEAN_SPEED * 0.7);
    float wave2 = sin(p.x * 5.0 - time * OCEAN_SPEED * 1.3) * cos(p.y * 4.0 + time * OCEAN_SPEED);
    float wave3 = fbm(p + time * OCEAN_SPEED * 0.5, 3);
    
    float ocean = wave1 * 0.3 + wave2 * 0.2 + wave3 * 0.5;
    
    // Specular highlight simulation
    float specular = pow(max(0.0, ocean), 3.0) * 0.5;
    
    return ocean * 0.5 + 0.5 + specular;
  }
  
  // === LAYER 2: PLASMA OVERLAY ===
  float plasmaLayer(vec2 uv, float time, float ripple) {
    vec2 p = uv * 3.0;
    
    // Domain warping for organic flow
    vec2 warpOffset = warp(p, time);
    float plasma = fbm(p + warpOffset * 2.0, 5);
    
    // Add ripple boost
    plasma += ripple * 0.3;
    
    // Create energy bands
    float bands = smoothstep(0.35, 0.5, plasma) - smoothstep(0.5, 0.65, plasma);
    bands += smoothstep(0.5, 0.55, plasma) * 0.3;
    
    return bands * PLASMA_INTENSITY;
  }
  
  // === LAYER 3: NEURAL MESH ===
  vec3 neuralMesh(vec2 uv, float time, float pulse) {
    vec3 meshColor = vec3(0.0);
    float nodeGlow = 0.0;
    
    // Generate node positions
    for (int i = 0; i < MESH_NODE_COUNT; i++) {
      float fi = float(i);
      vec2 nodePos = vec2(
        0.5 + 0.35 * sin(fi * 1.7 + time * 0.2) * cos(fi * 0.8 + time * 0.15),
        0.5 + 0.35 * cos(fi * 1.3 + time * 0.18) * sin(fi * 1.1 + time * 0.12)
      );
      
      float dist = length(uv - nodePos);
      
      // Node glow
      float glow = 0.008 / (dist + 0.01);
      glow *= (1.0 + pulse * 0.5); // Pulse on click
      nodeGlow += glow;
      
      // Draw connections to nearby nodes
      for (int j = 0; j < MESH_NODE_COUNT; j++) {
        if (j <= i) continue;
        float fj = float(j);
        vec2 otherPos = vec2(
          0.5 + 0.35 * sin(fj * 1.7 + time * 0.2) * cos(fj * 0.8 + time * 0.15),
          0.5 + 0.35 * cos(fj * 1.3 + time * 0.18) * sin(fj * 1.1 + time * 0.12)
        );
        
        // Line segment distance
        vec2 pa = uv - nodePos;
        vec2 ba = otherPos - nodePos;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float lineDist = length(pa - ba * h);
        
        // Only connect nearby nodes
        float nodeDist = length(nodePos - otherPos);
        if (nodeDist < 0.4) {
          float lineGlow = 0.001 / (lineDist + 0.005);
          lineGlow *= (1.0 - nodeDist / 0.4) * (1.0 + pulse * 0.3);
          meshColor.g += lineGlow * 0.5;
        }
      }
    }
    
    meshColor.g += nodeGlow;
    meshColor.r += nodeGlow * 0.3;
    meshColor.b += nodeGlow * 0.1;
    
    return meshColor * 0.6;
  }
  
  // === RIPPLE EFFECT ===
  float rippleEffect(vec2 uv, vec2 clickPos, float clickTime, float currentTime) {
    if (clickTime < 0.0) return 0.0;
    
    float timeSinceClick = currentTime - clickTime;
    if (timeSinceClick > 2.0) return 0.0;
    
    float dist = length(uv - clickPos);
    float rippleRadius = timeSinceClick * RIPPLE_SPEED * 0.3;
    float rippleWidth = 0.1;
    
    float ripple = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) -
                   smoothstep(rippleRadius, rippleRadius + rippleWidth, dist);
    
    ripple *= exp(-timeSinceClick * 1.5) * RIPPLE_STRENGTH;
    
    return ripple;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);
    
    float time = u_time;
    
    // Mouse position normalized
    vec2 mouseNorm = u_mouse / u_resolution.xy;
    mouseNorm.x *= aspect;
    
    // Calculate mouse influence (magnetic disturbance)
    vec2 mouseInfluence = vec2(0.0);
    if (u_mouseActive > 0.5) {
      vec2 toMouse = uvAspect - mouseNorm;
      float mouseDist = length(toMouse);
      mouseInfluence = normalize(toMouse) * exp(-mouseDist * 3.0) * 0.15;
    }
    
    // Ripple from click
    vec2 clickNorm = u_clickPos / u_resolution.xy;
    float ripple = rippleEffect(uv, clickNorm, u_clickTime, time);
    float pulse = ripple * 3.0; // Neural pulse strength
    
    // === COMBINE ALL LAYERS ===
    
    // Layer 1: Ocean base
    float ocean = oceanLayer(uv, time, mouseInfluence);
    
    // Layer 2: Plasma overlay
    float plasma = plasmaLayer(uv, time, ripple);
    
    // Layer 3: Neural mesh
    vec3 mesh = neuralMesh(uv, time, pulse);
    
    // Brand colors
    vec3 brandGreen = vec3(0.757, 1.0, 0.447); // #C1FF72
    vec3 darkGreen = vec3(0.1, 0.25, 0.08);
    vec3 darkBg = vec3(0.03, 0.04, 0.03);
    vec3 accentGlow = vec3(0.4, 0.9, 0.3);
    
    // Build final color
    vec3 color = mix(darkBg, darkGreen, ocean * 0.4);
    color += brandGreen * plasma * u_intensity;
    color += mesh * brandGreen;
    
    // Add ripple glow
    color += brandGreen * ripple * 0.5;
    
    // Mouse glow
    if (u_mouseActive > 0.5) {
      float mouseGlow = exp(-length(uv - u_mouse / u_resolution.xy) * 5.0) * 0.2;
      color += brandGreen * mouseGlow;
    }
    
    // Subtle vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.35;
    color *= vignette;
    
    // Ensure we don't clip
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface PlasmaOceanNeuralProps {
  className?: string;
  intensity?: number;
  isVisible?: boolean;
}

export default function PlasmaOceanNeural({
  className = "",
  intensity = 1.0,
  isVisible = true
}: PlasmaOceanNeuralProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isVisibleRef = useRef(true);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const clickRef = useRef({ x: 0, y: 0, time: -1 });
  const [hasWebGL, setHasWebGL] = useState(true);

  const uniformsRef = useRef<{
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    mouseActive: WebGLUniformLocation | null;
    clickTime: WebGLUniformLocation | null;
    clickPos: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
  }>({
    time: null,
    resolution: null,
    mouse: null,
    mouseActive: null,
    clickTime: null,
    clickPos: null,
    intensity: null,
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

  // Use refs for props that change frequently to avoid re-running the main effect
  const intensityRef = useRef(intensity);
  const isVisiblePropRef = useRef(isVisible);

  useEffect(() => {
    intensityRef.current = intensity;
    isVisiblePropRef.current = isVisible;
  }, [intensity, isVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setHasWebGL(false);
      return;
    }

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "default" // Balance quality and power
    });

    if (!gl) {
      setHasWebGL(false);
      return;
    }

    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      setHasWebGL(false);
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      setHasWebGL(false);
      return;
    }

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
      clickTime: gl.getUniformLocation(program, "u_clickTime"),
      clickPos: gl.getUniformLocation(program, "u_clickPos"),
      intensity: gl.getUniformLocation(program, "u_intensity"),
    };

    // Handle resize - cap DPR for mobile performance
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse/touch handlers
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      mouseRef.current.x = (clientX - rect.left) * dpr;
      mouseRef.current.y = canvas.height - (clientY - rect.top) * dpr;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      clickRef.current.x = (clientX - rect.left) * dpr;
      clickRef.current.y = canvas.height - (clientY - rect.top) * dpr;
      clickRef.current.time = (Date.now() - startTimeRef.current) / 1000;
    };

    canvas.addEventListener("mousemove", handlePointerMove);
    canvas.addEventListener("touchmove", handlePointerMove);
    canvas.addEventListener("mouseleave", handlePointerLeave);
    canvas.addEventListener("touchend", handlePointerLeave);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleClick);

    // Visibility change handler
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Animation loop
    const render = () => {
      if (!gl || !programRef.current) return;

      // Check visibility via refs
      if (!isVisibleRef.current || !isVisiblePropRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const time = (Date.now() - startTimeRef.current) / 1000;
      const uniforms = uniformsRef.current;

      gl.uniform1f(uniforms.time, time);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.mouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uniforms.mouseActive, mouseRef.current.active ? 1.0 : 0.0);
      gl.uniform1f(uniforms.clickTime, clickRef.current.time);
      gl.uniform2f(uniforms.clickPos, clickRef.current.x, clickRef.current.y);
      gl.uniform1f(uniforms.intensity, intensityRef.current);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("mousemove", handlePointerMove);
      canvas.removeEventListener("touchmove", handlePointerMove);
      canvas.removeEventListener("mouseleave", handlePointerLeave);
      canvas.removeEventListener("touchend", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleClick);
      cancelAnimationFrame(animationRef.current);
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, [createShader, createProgram]); // Removed intensity and isVisible from deps

  // Fallback for no WebGL or reduced motion
  if (!hasWebGL) {
    return (
      <div
        className={`plasma-ocean-neural-fallback ${className}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(ellipse at 30% 40%, rgba(193, 255, 114, 0.2) 0%, rgba(20, 50, 20, 0.5) 40%, rgba(15, 17, 21, 1) 100%)",
          zIndex: 0,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`plasma-ocean-neural ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        cursor: "crosshair",
      }}
    />
  );
}
