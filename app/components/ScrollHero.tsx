"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import PlasmaOceanNeural to avoid SSR issues
const PlasmaOceanNeural = dynamic(() => import("./PlasmaOceanNeural"), {
    ssr: false,
    loading: () => <div style={{ background: "linear-gradient(135deg, #1a3d1c 0%, #0f1115 100%)", position: "absolute", inset: 0 }} />
});

interface Role {
    id: string;
    title: string;
    brand: string;
    team: string;
    type: string;
    location: string;
    summary: string;
}

interface ScrollHeroProps {
    roles: Role[];
    onCategoryClick: (team: string | null) => void;
}

export default function ScrollHero({ roles, onCategoryClick }: ScrollHeroProps) {
    // Refs for direct DOM manipulation (High Performance Mode)
    const viewportRef = useRef<HTMLDivElement>(null);
    const plasmaContainerRef = useRef<HTMLDivElement>(null);
    const stage1Ref = useRef<HTMLDivElement>(null);
    const stage1XRef = useRef<HTMLSpanElement>(null);
    const stage1TextRef = useRef<HTMLParagraphElement>(null);
    const stage2Ref = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [windowHeight, setWindowHeight] = useState(1000); // Keep this for layout calculations
    const lastWidth = useRef(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        // Initialize constants based on current window height
        let currentHeight = window.innerHeight;
        setWindowHeight(currentHeight);
        lastWidth.current = window.innerWidth;

        // Animation Loop
        const loop = () => {
            const scrollY = window.scrollY;
            const height = currentHeight;

            // Define stages
            const stage1End = height;
            const stage2Start = height * 0.5;
            const stage2Peak = height * 1.5;
            const stage2End = height * 2.5;

            // --- STAGE 1 LOGIC ---
            const stage1Progress = Math.min(scrollY / stage1End, 1);
            const stage1Opacity = Math.max(0, 1 - stage1Progress * 1.5);
            const stage1Scale = 1 + stage1Progress * 1.5;

            if (stage1Ref.current) {
                stage1Ref.current.style.opacity = stage1Opacity.toFixed(3);
                stage1Ref.current.style.transform = `scale(${stage1Scale.toFixed(3)})`;
                stage1Ref.current.style.pointerEvents = stage1Opacity > 0.3 ? "auto" : "none";
            }

            if (stage1XRef.current) {
                stage1XRef.current.style.transform = `rotate(${(stage1Progress * 360).toFixed(1)}deg)`;
            }

            if (stage1TextRef.current) {
                const textOpacity = Math.max(0, 1 - stage1Progress * 8);
                stage1TextRef.current.style.opacity = textOpacity.toFixed(3);
            }

            // --- STAGE 2 LOGIC ---
            const stage2FadeIn = Math.min(Math.max((scrollY - stage2Start) / (stage2Peak - stage2Start), 0), 1);
            const stage2FadeOut = Math.min(Math.max((scrollY - stage2Peak) / (stage2End - stage2Peak), 0), 1);
            const stage2Opacity = scrollY < stage2Peak ? stage2FadeIn : Math.max(0, 1 - stage2FadeOut);
            const stage2Scale = 1 + Math.max(0, (scrollY - stage2Peak) / height) * 0.5;

            if (stage2Ref.current) {
                stage2Ref.current.style.opacity = stage2Opacity.toFixed(3);
                stage2Ref.current.style.transform = `scale(${stage2Scale.toFixed(3)})`;
            }

            // --- BACKGROUND LOGIC ---
            // Color Transition
            const colorProgress = Math.min(Math.max((scrollY - stage2Start) / (stage2Peak - stage2Start), 0), 1);
            const bgR = Math.round(15 + (30 - 15) * colorProgress);
            const bgG = Math.round(17 + (60 - 17) * colorProgress);
            const bgB = Math.round(21 + (30 - 21) * colorProgress);

            if (viewportRef.current) {
                viewportRef.current.style.backgroundColor = `rgb(${bgR}, ${bgG}, ${bgB})`;

                // Toggle viewport visibility based on total scroll to save GPU
                const isActive = scrollY < stage2End;
                viewportRef.current.style.zIndex = isActive ? "100" : "-1";
                viewportRef.current.style.opacity = isActive ? "1" : "0";
                viewportRef.current.style.pointerEvents = isActive ? "auto" : "none";
            }

            if (plasmaContainerRef.current) {
                plasmaContainerRef.current.style.opacity = stage2Opacity.toFixed(3);
            }

            // --- HEADER VISIBILITY ---
            const showHeader = scrollY > stage2End - height * 0.3;
            if (headerRef.current) {
                const headerOpacity = showHeader ? 1 : 0;
                // Only update if changed to avoid thrashing (though assignment is cheap)
                // We can just assign it each frame, the browser optimizes if value is same.
                headerRef.current.style.opacity = showHeader ? "1" : "0";
                headerRef.current.style.pointerEvents = showHeader ? "auto" : "none";
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        // Start Loop
        loop();

        const handleResize = () => {
            const newWidth = window.innerWidth;
            if (newWidth !== lastWidth.current) {
                lastWidth.current = newWidth;
                currentHeight = window.innerHeight;
                setWindowHeight(currentHeight);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Static height for container
    const heroHeight = windowHeight * 3;

    return (
        <>
            {/* Scroll container */}
            <div
                ref={containerRef}
                style={{
                    height: `${heroHeight}px`,
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {/* Fixed viewport */}
                <div
                    ref={viewportRef}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "100vh",
                        overflow: "hidden",
                        backgroundColor: "rgb(15, 17, 21)", // Initial color
                        zIndex: 100,
                        willChange: "background-color, opacity"
                    }}
                >
                    {/* === PLASMA OCEAN NEURAL BACKGROUND === */}
                    <div
                        ref={plasmaContainerRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0, // Initial state
                            transition: "opacity 0.1s linear", // Slight smoothing for the canvas
                            zIndex: 1,
                            willChange: "opacity"
                        }}
                    >
                        {/* We keep isVisible true because we handle opacity via parent div */}
                        <PlasmaOceanNeural intensity={1.0} isVisible={true} />
                    </div>

                    {/* === STAGE 1: Black screen with logos === */}
                    <div
                        ref={stage1Ref}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: 1,
                            transform: "scale(1)",
                            zIndex: 10,
                            padding: "20px",
                            textAlign: "center",
                            willChange: "opacity, transform"
                        }}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flexWrap: "nowrap",
                            justifyContent: "center",
                            marginBottom: "32px",
                            width: "100%",
                            padding: "0 16px",
                            boxSizing: "border-box"
                        }}>
                            {/* Adspend Agency Logo */}
                            <img
                                src="/adspend-logo.png"
                                alt="Adspend Agency"
                                style={{
                                    height: "clamp(60px, 15vw, 130px)",
                                    width: "auto",
                                    maxWidth: "42vw",
                                    objectFit: "contain"
                                }}
                            />
                            <span
                                ref={stage1XRef}
                                style={{
                                    fontSize: "clamp(18px, 3vw, 32px)",
                                    color: "rgba(255,255,255,0.4)",
                                    fontWeight: 200,
                                    flexShrink: 0,
                                    display: "inline-block",
                                    willChange: "transform"
                                }}>
                                ×
                            </span>
                            {/* OperatorHQ Logo */}
                            <img
                                src="/operatorhq-logo.png"
                                alt="OperatorHQ AI"
                                style={{
                                    height: "clamp(60px, 15vw, 130px)",
                                    width: "auto",
                                    maxWidth: "42vw",
                                    objectFit: "contain",
                                    marginLeft: "-10px"
                                }}
                            />
                        </div>
                        <p
                            ref={stage1TextRef}
                            style={{
                                fontSize: "14px",
                                color: "rgba(255,255,255,0.5)",
                                animation: "pulse 2s ease-in-out infinite",
                                opacity: 1,
                                transition: "opacity 0.1s ease-out"
                            }}>
                            Scroll to begin
                        </p>
                    </div>

                    {/* === STAGE 2: Green background with quote === */}
                    <div
                        ref={stage2Ref}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: 0,
                            transform: "scale(1)",
                            zIndex: 5,
                            padding: "40px 20px",
                            textAlign: "center",
                            pointerEvents: "none",
                            willChange: "opacity, transform"
                        }}
                    >
                        <h2 style={{
                            fontSize: "clamp(32px, 6vw, 64px)",
                            fontWeight: 900,
                            color: "#000",
                            maxWidth: "900px",
                            lineHeight: 1.1,
                            letterSpacing: "-0.03em",
                            textShadow: "0 2px 30px rgba(0,0,0,0.1)",
                        }}>
                            Where individual imaginations gather to build systems that scale.
                        </h2>
                    </div>
                </div>
            </div>

            {/* Header - appears after hero section */}
            <header
                ref={headerRef}
                className="header"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    opacity: 0, // Initial state
                    pointerEvents: "none",
                    transition: "opacity 0.3s ease",
                    background: "rgba(15, 17, 21, 0.9)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <div className="container header-inner">
                    <div className="header-brand">
                        <a href="https://adspend.agency" target="_blank" rel="noopener noreferrer">
                            <img src="/adspend-logo.png" alt="Adspend Agency" className="header-logo" />
                        </a>
                        <span className="header-x">×</span>
                        <a href="https://operatorai.agency" target="_blank" rel="noopener noreferrer">
                            <img src="/operatorhq-logo.png" alt="OperatorHQ AI" className="header-logo" />
                        </a>
                    </div>
                    <button
                        className="header-cta"
                        onClick={() => {
                            const jobsSection = document.getElementById("jobs");
                            if (jobsSection) {
                                jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                        }}
                    >
                        View Open Roles
                    </button>
                </div>
            </header>
        </>
    );
}
