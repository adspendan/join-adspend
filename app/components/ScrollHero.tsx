"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import PlasmaOcean to avoid SSR issues
const PlasmaOcean = dynamic(() => import("./PlasmaOcean"), {
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
    const [scrollY, setScrollY] = useState(0);
    const [windowHeight, setWindowHeight] = useState(1000);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setWindowHeight(window.innerHeight);

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Calculate which stage we're in based on scroll position
    // Stage 1: 0 to 1 screen height - Black with logos
    // Stage 2: 1 to 2.5 screen heights - Green with ocean + quote
    // Stage 3: 2.5+ screen heights - Fade out, reveal content below

    const stage1End = windowHeight;
    const stage2Start = windowHeight * 0.5;
    const stage2Peak = windowHeight * 1.5;
    const stage2End = windowHeight * 2.5;

    // Stage 1 calculations (black screen with logos - zooms towards camera as you scroll)
    const stage1Progress = Math.min(scrollY / stage1End, 1);
    const stage1Opacity = Math.max(0, 1 - stage1Progress * 1.5);
    const stage1Scale = 1 + stage1Progress * 1.5; // Zoom towards camera

    // Stage 2 calculations (green with ocean + quote)
    const stage2FadeIn = Math.min(Math.max((scrollY - stage2Start) / (stage2Peak - stage2Start), 0), 1);
    const stage2FadeOut = Math.min(Math.max((scrollY - stage2Peak) / (stage2End - stage2Peak), 0), 1);
    const stage2Opacity = scrollY < stage2Peak
        ? stage2FadeIn
        : Math.max(0, 1 - stage2FadeOut);
    const stage2Scale = 1 + Math.max(0, (scrollY - stage2Peak) / windowHeight) * 0.5; // Zoom text towards camera after peak

    // Background color transition (black -> green)
    const colorProgress = Math.min(Math.max((scrollY - stage2Start) / (stage2Peak - stage2Start), 0), 1);
    const bgR = Math.round(15 + (30 - 15) * colorProgress); // Darker green base
    const bgG = Math.round(17 + (60 - 17) * colorProgress);
    const bgB = Math.round(21 + (30 - 21) * colorProgress);

    // Header visibility (show after scrolling past stage 2)
    const showHeader = scrollY > stage2End - windowHeight * 0.3;

    // Total scroll height for the hero section
    const heroHeight = windowHeight * 3;

    return (
        <>
            {/* Scroll container - this creates the scroll space */}
            <div
                ref={containerRef}
                style={{
                    height: `${heroHeight}px`,
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {/* Fixed viewport that stays in view while scrolling */}
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "100vh",
                        overflow: "hidden",
                        backgroundColor: `rgb(${bgR}, ${bgG}, ${bgB})`,
                        zIndex: scrollY < stage2End ? 100 : -1,
                        opacity: scrollY < stage2End ? 1 : 0,
                        pointerEvents: scrollY < stage2End ? "auto" : "none",
                        transition: "opacity 0.3s ease",
                    }}
                >
                    {/* === PLASMA OCEAN BACKGROUND === */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: stage2Opacity,
                            transition: "opacity 0.15s ease",
                            zIndex: 1,
                        }}
                    >
                        <PlasmaOcean intensity={1.2} isVisible={stage2Opacity > 0.1} />
                    </div>

                    {/* === STAGE 1: Black screen with logos === */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: stage1Opacity,
                            transform: `scale(${stage1Scale})`,
                            zIndex: 10,
                            padding: "20px",
                            textAlign: "center",
                            pointerEvents: stage1Opacity > 0.3 ? "auto" : "none",
                        }}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            marginBottom: "24px"
                        }}>
                            <span style={{
                                fontSize: "clamp(28px, 5vw, 52px)",
                                fontWeight: 800,
                                color: "#fff",
                                letterSpacing: "-0.02em"
                            }}>
                                Adspend Agency
                            </span>
                            <span style={{
                                fontSize: "clamp(24px, 4vw, 40px)",
                                color: "rgba(255,255,255,0.5)",
                                fontWeight: 300
                            }}>
                                ×
                            </span>
                            <span style={{
                                fontSize: "clamp(28px, 5vw, 52px)",
                                fontWeight: 800,
                                color: "#fff",
                                letterSpacing: "-0.02em"
                            }}>
                                OperatorHQ AI
                            </span>
                        </div>
                        <p style={{
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.5)",
                            animation: "pulse 2s ease-in-out infinite"
                        }}>
                            Scroll to begin
                        </p>
                    </div>

                    {/* === STAGE 2: Green background with quote === */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: stage2Opacity,
                            transform: `scale(${stage2Scale})`,
                            zIndex: 5,
                            padding: "40px 20px",
                            textAlign: "center",
                            pointerEvents: stage2Opacity > 0.5 ? "auto" : "none",
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
                className="header"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    opacity: showHeader ? 1 : 0,
                    pointerEvents: showHeader ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                    background: "rgba(15, 17, 21, 0.9)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <div className="container header-inner">
                    <div className="header-brand">
                        <a href="https://adspend.agency" target="_blank" rel="noopener noreferrer">
                            Adspend Agency
                        </a>
                        <span className="header-x">×</span>
                        <a href="https://operatorai.agency" target="_blank" rel="noopener noreferrer">
                            OperatorHQ AI
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
