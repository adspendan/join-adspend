"use client";

import { useEffect, useRef } from "react";

interface Role {
    id: string;
    title: string;
    brand: string;
    team: string;
    type: string;
    location: string;
    summary: string;
    responsibilities?: string[];
    requirements?: string[];
    proofOfWork?: string[];
    success30?: string;
    success60?: string;
    success90?: string;
    applyUrl?: string;
}

interface JobModalProps {
    role: Role | null;
    isOpen: boolean;
    onClose: () => void;
}

const APPLY_URL = "https://form.typeform.com/to/XG6oHXSn";

export default function JobModal({ role, isOpen, onClose }: JobModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!role) return null;

    const applyLink = `${APPLY_URL}?role=${encodeURIComponent(role.title)}`;

    return (
        <div className={`modal ${isOpen ? "open" : ""}`} role="dialog" aria-modal="true">
            <div className="modal-content" ref={modalRef}>
                <div className="modal-header">
                    <h3>{role.title}</h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* Meta Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                        <span className="job-card-brand">{role.brand}</span>
                        <span className="job-card-pill">{role.team}</span>
                        <span className="job-card-pill">{role.type}</span>
                        <span className="job-card-pill">{role.location}</span>
                    </div>

                    {/* Summary */}
                    <p style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border)", lineHeight: "1.7" }}>
                        {role.summary}
                    </p>

                    {/* Responsibilities */}
                    {role.responsibilities && role.responsibilities.length > 0 && (
                        <div className="modal-section">
                            <h4>📋 Responsibilities</h4>
                            <ul>
                                {role.responsibilities.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Requirements */}
                    {role.requirements && role.requirements.length > 0 && (
                        <div className="modal-section">
                            <h4>✅ Requirements</h4>
                            <ul>
                                {role.requirements.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Proof of Work */}
                    {role.proofOfWork && role.proofOfWork.length > 0 && (
                        <div className="modal-section">
                            <h4>🎯 Proof of Work (Required)</h4>
                            <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "14px" }}>
                                Include these in your application:
                            </p>
                            <ul>
                                {role.proofOfWork.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Success Criteria */}
                    {(role.success30 || role.success60 || role.success90) && (
                        <div className="modal-section">
                            <h4>🏆 What Success Looks Like</h4>
                            <div className="success-grid">
                                {role.success30 && (
                                    <div className="success-item">
                                        <strong>30 Days</strong>
                                        <span>{role.success30}</span>
                                    </div>
                                )}
                                {role.success60 && (
                                    <div className="success-item">
                                        <strong>60 Days</strong>
                                        <span>{role.success60}</span>
                                    </div>
                                )}
                                {role.success90 && (
                                    <div className="success-item">
                                        <strong>90 Days</strong>
                                        <span>{role.success90}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <a
                            href={applyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-apply"
                        >
                            Apply Now
                        </a>
                        <button className="modal-cancel" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
