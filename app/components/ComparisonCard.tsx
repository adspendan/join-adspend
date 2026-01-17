"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface ComparisonCardProps {
    title: string;
    items: string[];
    variant: "positive" | "negative";
}

interface FloatingEmoji {
    id: number;
    x: number;
    y: number;
    angle: number;
    speed: number;
    scale: number;
    life: number;
    rotation: number;
}

export default function ComparisonCard({ title, items, variant }: ComparisonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);
    const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
    const emojiIdRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const emoji = variant === "positive" ? "🎉" : "🚫";

    // Track mouse position
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    // Create floating emoji from cursor position (like sparkler)
    const createEmoji = useCallback(() => {
        const angle = Math.random() * Math.PI * 2; // Random direction
        const speed = 0.3 + Math.random() * 0.8; // Slower, varied speed

        const newEmoji: FloatingEmoji = {
            id: emojiIdRef.current++,
            x: mousePos.x + (Math.random() - 0.5) * 5, // Small offset from cursor
            y: mousePos.y + (Math.random() - 0.5) * 5,
            angle,
            speed,
            scale: 0, // Start tiny
            life: 1,
            rotation: Math.random() * 360,
        };
        setEmojis(prev => [...prev.slice(-10), newEmoji]); // Max 10 emojis
    }, [mousePos.x, mousePos.y]);

    // Create emojis at random intervals while hovered
    useEffect(() => {
        if (isHovered) {
            const scheduleNext = () => {
                const delay = 180 + Math.random() * 220;
                intervalRef.current = setTimeout(() => {
                    createEmoji();
                    scheduleNext();
                }, delay);
            };
            // Initial emoji
            createEmoji();
            scheduleNext();
        } else {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
                intervalRef.current = null;
            }
            // Let existing emojis fade
            setTimeout(() => setEmojis([]), 600);
        }

        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [isHovered, createEmoji]);

    // Animate emojis - move outward, grow then shrink
    useEffect(() => {
        if (emojis.length === 0) return;

        const animationFrame = requestAnimationFrame(() => {
            setEmojis(prev =>
                prev
                    .map(e => {
                        const newLife = e.life - 0.02;
                        const phase = 1 - newLife; // 0 to 1

                        // Scale: grow from 0 to 1.2 quickly, then shrink to 0
                        let newScale;
                        if (phase < 0.25) {
                            // Growing phase (fast)
                            newScale = (phase / 0.25) * 1.2;
                        } else {
                            // Shrinking phase (slower)
                            newScale = 1.2 * (1 - (phase - 0.25) / 0.75);
                        }

                        return {
                            ...e,
                            // Move outward from cursor like sparkles
                            x: e.x + Math.cos(e.angle) * e.speed * 1.5,
                            y: e.y + Math.sin(e.angle) * e.speed * 1.5 + 0.15, // Slight upward drift
                            scale: Math.max(0, newScale),
                            life: newLife,
                            rotation: e.rotation + 3,
                        };
                    })
                    .filter(e => e.life > 0)
            );
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [emojis]);

    return (
        <article
            ref={cardRef}
            className={`card comparison-card ${variant === "positive" ? "is-for" : "not-for"}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ position: "relative", overflow: "hidden" }}
        >
            {/* Floating emojis from cursor */}
            {emojis.map(e => (
                <div
                    key={e.id}
                    style={{
                        position: "absolute",
                        left: `${e.x}%`,
                        top: `${e.y}%`,
                        fontSize: `${20 * e.scale}px`,
                        opacity: e.scale > 0.1 ? Math.min(1, e.life * 1.5) : 0,
                        transform: `translate(-50%, -50%) rotate(${e.rotation}deg)`,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                >
                    {emoji}
                </div>
            ))}

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 3 }}>
                <h3>{title}</h3>
                <ul className="comparison-list">
                    {items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </article>
    );
}
