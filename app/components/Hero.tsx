"use client";

import { useState, useEffect, useMemo } from "react";
import PlasmaBackground from "./PlasmaBackground";

interface Role {
    id: string;
    title: string;
    brand: string;
    team: string;
    type: string;
    location: string;
    summary: string;
}

interface HeroProps {
    roles: Role[];
    onCategoryClick: (team: string | null) => void;
}

export default function Hero({ roles, onCategoryClick }: HeroProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Extract unique teams with counts
    const categories = useMemo(() => {
        const teamCounts: Record<string, number> = {};
        roles.forEach((role) => {
            teamCounts[role.team] = (teamCounts[role.team] || 0) + 1;
        });

        // Sort by count descending, then alphabetically
        return Object.entries(teamCounts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([team, count]) => ({ team, count }));
    }, [roles]);

    const handleCategoryClick = (team: string | null) => {
        setActiveCategory(team);
        onCategoryClick(team);

        // Smooth scroll to jobs section
        const jobsSection = document.getElementById("jobs");
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <section className="hero">
            {/* Animated Background */}
            <PlasmaBackground intensity={0.9} />

            {/* Hero Content */}
            <div
                className="hero-content"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.8s ease, transform 0.8s ease",
                }}
            >
                {/* Brand Split */}
                <div className="hero-brands">
                    <a
                        href="https://adspend.agency"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-brand"
                    >
                        Adspend Agency
                    </a>
                    <span className="hero-brand-x">×</span>
                    <a
                        href="https://operatorai.agency"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-brand"
                    >
                        Operator<span className="brand-highlight">HQ</span>
                    </a>
                </div>

                {/* Headline */}
                <h1 className="hero-headline">Join the Future</h1>

                <p className="hero-subheadline">
                    We build systems that move real money. Join the teams shaping the
                    future of performance marketing and Agentic AI.
                </p>

                {/* CTA Button */}
                <button
                    className="hero-cta"
                    onClick={() => handleCategoryClick(null)}
                >
                    Join Us
                </button>
            </div>

            {/* Category Tabs */}
            <div
                className="category-tabs-wrapper"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
                }}
            >
                <div className="category-tabs">
                    {/* All Roles Tab */}
                    <button
                        className={`category-tab ${activeCategory === null ? "active" : ""}`}
                        onClick={() => handleCategoryClick(null)}
                    >
                        All Roles
                        <span className="category-tab-count">{roles.length}</span>
                    </button>

                    {/* Dynamic Category Tabs */}
                    {categories.map(({ team, count }) => (
                        <button
                            key={team}
                            className={`category-tab ${activeCategory === team ? "active" : ""}`}
                            onClick={() => handleCategoryClick(team)}
                        >
                            {team}
                            <span className="category-tab-count">{count}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
