"use client";

import { useState, useEffect } from "react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToJobs = () => {
        const jobsSection = document.getElementById("jobs");
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <header className={`header ${isScrolled ? "scrolled" : ""}`}>
            <div className="container header-inner">
                <div className="header-brand">
                    <a
                        href="https://adspend.agency"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img src="/adspend-logo.png" alt="Adspend Agency" className="header-logo" />
                    </a>
                    <span className="header-x">×</span>
                    <a
                        href="https://operatorai.agency"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img src="/operatorhq-logo.png" alt="OperatorHQ AI" className="header-logo" />
                    </a>
                </div>

                <button className="header-cta" onClick={scrollToJobs}>
                    View Open Roles
                </button>
            </div>
        </header>
    );
}
