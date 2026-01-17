"use client";

import { useState, useEffect, useRef } from "react";

interface HeartButtonProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export default function HeartButton({ href, children, className = "" }: HeartButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [scale, setScale] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [floatY, setFloatY] = useState(0);
    const [phase, setPhase] = useState<"idle" | "grow" | "wobble" | "shrink">("idle");
    const animationRef = useRef<number | null>(null);
    const wobbleTimeRef = useRef(0);

    const handleMouseEnter = () => {
        setIsHovered(true);
        setPhase("grow");
        setScale(0);
        setFloatY(0);
        wobbleTimeRef.current = 0;
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setPhase("shrink");
    };

    useEffect(() => {
        if (phase === "idle") return;

        const animate = () => {
            if (phase === "grow") {
                setScale(prev => {
                    const next = prev + 0.1;
                    if (next >= 1) {
                        setPhase("wobble");
                        return 1;
                    }
                    return next;
                });
                // Float up 3px as it grows
                setFloatY(prev => Math.min(prev + 0.3, 3));
            } else if (phase === "wobble") {
                wobbleTimeRef.current += 0.1;
                // Very subtle wobble
                setRotation(Math.sin(wobbleTimeRef.current) * 8);
            } else if (phase === "shrink") {
                setScale(prev => {
                    const next = prev - 0.15;
                    if (next <= 0) {
                        setPhase("idle");
                        setFloatY(0);
                        return 0;
                    }
                    return next;
                });
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [phase]);

    // Stop wobbling when mouse leaves
    useEffect(() => {
        if (!isHovered && phase === "wobble") {
            setPhase("shrink");
        }
    }, [isHovered, phase]);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: "relative" }}
        >
            {children}

            {/* Heart emoji at center-top, floats up slightly */}
            {phase !== "idle" && (
                <span
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: -floatY,
                        fontSize: 20,
                        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                        opacity: scale,
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                >
                    ❤️
                </span>
            )}
        </a>
    );
}
