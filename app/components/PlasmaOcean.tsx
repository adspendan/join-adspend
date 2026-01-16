"use client";

import { useRef, useEffect, useCallback, useState } from "react";

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - Smooth flowing plasma without mouse interaction
// Optimized for performance - no pointer events needed
const fragmentShaderSource = `
  precision highp float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_intensity;
  
  // Simple hash for pseudo-random
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  // Smooth noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // Fractional Brownian Motion - creates organic patterns
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Domain warping - creates flowing movement
  vec2 warp(vec2 p, float time) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + time * 0.08),
      fbm(p + vec2(5.2, 1.3) + time * 0.1)
    );
    
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + time * 0.12),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.1)
    );
    
    return r;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 3.0;
    
    float time = u_time * 0.4;
    
    // Apply domain warping
    vec2 warpOffset = warp(p, time);
    float pattern = fbm(p + warpOffset * 2.0);
    
    // Create plasma bands
    float plasma = smoothstep(0.3, 0.5, pattern) - smoothstep(0.5, 0.7, pattern);
    plasma += smoothstep(0.5, 0.6, pattern) * 0.5;
    
    // Brand colors: #C1FF72 (green)
    vec3 brandGreen = vec3(0.757, 1.0, 0.447);
    vec3 darkGreen = vec3(0.15, 0.35, 0.1);
    vec3 darkBg = vec3(0.04, 0.06, 0.04);
    
    // Mix colors based on pattern
    vec3 color = mix(darkBg, darkGreen, pattern * 0.5);
    color = mix(color, brandGreen, plasma * 0.6 * u_intensity);
    
    // Add subtle glow
    float glow = pow(pattern, 2.5) * 0.3;
    color += brandGreen * glow * u_intensity;
    
    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.4;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface PlasmaOceanProps {
    className?: string;
    intensity?: number;
    isVisible?: boolean;
}

export default function PlasmaOcean({
    className = "",
    intensity = 1.0,
    isVisible = true
}: PlasmaOceanProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const isVisibleRef = useRef(true);
    const [hasWebGL, setHasWebGL] = useState(true);

    const uniformsRef = useRef<{
        time: WebGLUniformLocation | null;
        resolution: WebGLUniformLocation | null;
        intensity: WebGLUniformLocation | null;
    }>({
        time: null,
        resolution: null,
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
            powerPreference: "low-power"
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

        // Create geometry (single full-screen quad)
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
            intensity: gl.getUniformLocation(program, "u_intensity"),
        };

        // Handle resize with DPR capping for performance
        const handleResize = () => {
            const dpr = Math.min(window.devicePixelRatio, 1.5);
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        // Visibility change handler (pause when tab hidden)
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === "visible";
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Animation loop - smooth 60fps
        const render = () => {
            if (!gl || !programRef.current) return;

            if (!isVisibleRef.current || !isVisible) {
                animationRef.current = requestAnimationFrame(render);
                return;
            }

            const time = (Date.now() - startTimeRef.current) / 1000;
            const uniforms = uniformsRef.current;

            gl.uniform1f(uniforms.time, time);
            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
            gl.uniform1f(uniforms.intensity, intensity);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            cancelAnimationFrame(animationRef.current);
            if (gl && programRef.current) {
                gl.deleteProgram(programRef.current);
            }
        };
    }, [createShader, createProgram, intensity, isVisible]);

    // Fallback gradient for no WebGL or reduced motion
    if (!hasWebGL) {
        return (
            <div
                className={`plasma-ocean-fallback ${className}`}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "radial-gradient(ellipse at center, rgba(193, 255, 114, 0.2) 0%, rgba(15, 40, 15, 0.8) 50%, rgba(15, 17, 21, 1) 100%)",
                    zIndex: 0,
                }}
            />
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={`plasma-ocean ${className}`}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none", // No mouse interaction
            }}
        />
    );
}
