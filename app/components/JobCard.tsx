"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Role {
    id: string;
    title: string;
    brand: string;
    team: string;
    type: string;
    location: string;
    summary: string;
}

interface JobCardProps {
    role: Role;
    onClick: () => void;
}

interface Sparkle {
    id: number;
    x: number;
    y: number;
    angle: number;
    speed: number;
    size: number;
    life: number;
    brightness: number;
}

export default function JobCard({ role, onClick }: JobCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);
    const sparkleIdRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    // Create sparkle with random properties like a real sparkler
    const createSparkle = useCallback(() => {
        const angle = Math.random() * Math.PI * 2; // Random direction (360°)
        const speed = 0.3 + Math.random() * 1.2; // Slower, varied speed
        const size = 1 + Math.random() * 4; // Varied sizes (tiny to small)
        const brightness = 0.5 + Math.random() * 0.5; // Varied brightness

        const newSparkle: Sparkle = {
            id: sparkleIdRef.current++,
            x: mousePos.x + (Math.random() - 0.5) * 3, // Slight offset from center
            y: mousePos.y + (Math.random() - 0.5) * 3,
            angle,
            speed,
            size,
            life: 0.6 + Math.random() * 0.4, // Varied lifespan
            brightness,
        };
        setSparkles(prev => [...prev.slice(-20), newSparkle]); // Max 20 sparkles
    }, [mousePos.x, mousePos.y]);

    // Create sparkle bursts at random intervals (like a real sparkler)
    useEffect(() => {
        if (isHovered) {
            // Random interval between sparkles (150-350ms) for organic feel
            const scheduleNextSparkle = () => {
                const delay = 150 + Math.random() * 200;
                intervalRef.current = setTimeout(() => {
                    // Create 1-3 sparkles at once (burst effect)
                    const burstCount = 1 + Math.floor(Math.random() * 2);
                    for (let i = 0; i < burstCount; i++) {
                        createSparkle();
                    }
                    scheduleNextSparkle();
                }, delay);
            };
            scheduleNextSparkle();
        } else {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
                intervalRef.current = null;
            }
            // Let existing sparkles fade out naturally
            setTimeout(() => setSparkles([]), 500);
        }

        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [isHovered, createSparkle]);

    // Animate sparkles outward with physics
    useEffect(() => {
        if (sparkles.length === 0) return;

        const animationFrame = requestAnimationFrame(() => {
            setSparkles(prev =>
                prev
                    .map(s => ({
                        ...s,
                        // Slower movement, slight gravity
                        x: s.x + Math.cos(s.angle) * s.speed * 0.8,
                        y: s.y + Math.sin(s.angle) * s.speed * 0.8 + 0.1, // Slight downward drift
                        speed: s.speed * 0.98, // Gradual slowdown
                        life: s.life - 0.02, // Slower fade
                    }))
                    .filter(s => s.life > 0)
            );
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [sparkles]);

    return (
        <article
            ref={cardRef}
            className="card job-card"
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
            }}
        >
            {/* Subtle glow that follows cursor */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(193, 255, 114, 0.06) 0%, transparent 35%)`,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* Sparkles shooting outward from cursor - like a sparkler */}
            {sparkles.map(sparkle => (
                <div
                    key={sparkle.id}
                    style={{
                        position: "absolute",
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        width: sparkle.size * sparkle.life,
                        height: sparkle.size * sparkle.life,
                        background: `rgba(193, 255, 114, ${sparkle.brightness})`,
                        borderRadius: "50%",
                        opacity: sparkle.life,
                        boxShadow: `0 0 ${sparkle.size * 3}px rgba(193, 255, 114, ${sparkle.life * 0.6})`,
                        pointerEvents: "none",
                        zIndex: 2,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            ))}

            {/* Card Content */}
            <div style={{ position: "relative", zIndex: 3 }}>
                <span className="job-card-brand">{role.brand}</span>
                <h3 className="job-card-title">{role.title}</h3>
                <div className="job-card-meta">
                    <span className="job-card-pill">{role.team}</span>
                    <span className="job-card-pill">{role.type}</span>
                    <span className="job-card-pill">{role.location}</span>
                </div>
                <p className="job-card-summary">{role.summary}</p>
                <span className="job-card-action">View Role →</span>
            </div>
        </article>
    );
}
