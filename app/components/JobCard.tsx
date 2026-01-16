"use client";

import { useRef, useState } from "react";

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

export default function JobCard({ role, onClick }: JobCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

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
            {/* Spotlight glow that follows cursor */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(193, 255, 114, 0.15) 0%, transparent 50%)`,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* Sparkle dots - CSS animated */}
            {isHovered && (
                <>
                    <div className="sparkle-dot" style={{
                        left: `${mousePos.x - 5}%`,
                        top: `${mousePos.y - 5}%`,
                        animationDelay: "0s"
                    }} />
                    <div className="sparkle-dot" style={{
                        left: `${mousePos.x + 3}%`,
                        top: `${mousePos.y - 8}%`,
                        animationDelay: "0.1s"
                    }} />
                    <div className="sparkle-dot" style={{
                        left: `${mousePos.x + 7}%`,
                        top: `${mousePos.y + 2}%`,
                        animationDelay: "0.2s"
                    }} />
                    <div className="sparkle-dot" style={{
                        left: `${mousePos.x - 8}%`,
                        top: `${mousePos.y + 4}%`,
                        animationDelay: "0.15s"
                    }} />
                </>
            )}

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
