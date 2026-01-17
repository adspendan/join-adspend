"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ScrollHero from "./components/ScrollHero";
import JobCard from "./components/JobCard";
import JobModal from "./components/JobModal";
import ComparisonCard from "./components/ComparisonCard";
import HeartButton from "./components/HeartButton";

interface Role {
  id: string;
  title: string;
  brand: string;
  team: string;
  teams?: string[]; // Optional array for roles that belong to multiple teams
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

export default function Home() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Ref for team filter dropdown (sync with category clicks)
  const teamSelectRef = useRef<HTMLSelectElement>(null);

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch("/roles.json");
        const data = await response.json();
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Failed to load roles:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  // Filter roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        !searchQuery ||
        [role.title, role.summary, role.team, role.brand]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesBrand = !brandFilter || role.brand === brandFilter;
      // Check both primary team and additional teams array
      const matchesTeam = !teamFilter ||
        role.team === teamFilter ||
        (role.teams && role.teams.includes(teamFilter));
      const matchesType = !typeFilter || role.type === typeFilter;
      const matchesLocation = !locationFilter || role.location === locationFilter;

      return matchesSearch && matchesBrand && matchesTeam && matchesType && matchesLocation;
    });
  }, [roles, searchQuery, brandFilter, teamFilter, typeFilter, locationFilter]);

  // Get unique filter options
  const brands = useMemo(() => [...new Set(roles.map((r) => r.brand))], [roles]);
  const teams = useMemo(() => [...new Set(roles.map((r) => r.team))], [roles]);
  const types = useMemo(() => [...new Set(roles.map((r) => r.type))], [roles]);
  const locations = useMemo(() => [...new Set(roles.map((r) => r.location))], [roles]);

  // Handle category click from hero - sync with dropdown
  const handleCategoryClick = useCallback((team: string | null) => {
    setTeamFilter(team || "");
  }, []);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setBrandFilter("");
    setTeamFilter("");
    setTypeFilter("");
    setLocationFilter("");
  };

  return (
    <>
      {/* Scroll-based Hero */}
      <ScrollHero roles={roles} onCategoryClick={handleCategoryClick} />

      <main className="container main-content">
        {/* === HERO SECTION (Below scroll) === */}
        <section className="section hero-below">
          <h1 className="main-headline">
            Shape the Future of <span className="highlight">Agentic AI</span> & <span className="highlight">Performance Advertising</span>
          </h1>
          <p className="main-subheadline">
            We build systems that scale. If you like ownership, pressure, and shipping, you'll feel right at home.
          </p>
          <ul className="hero-bullets">
            <li><span className="bullet-icon">⚡</span> Proof of work &gt; resumes</li>
            <li><span className="bullet-icon">⚡</span> Paid trial sprints before long-term offers</li>
            <li><span className="bullet-icon">⚡</span> Real client impact from week one</li>
          </ul>
          <button
            className="btn btn-dark"
            onClick={() => {
              const jobsSection = document.getElementById("jobs");
              if (jobsSection) {
                jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            View Open Roles
          </button>
        </section>

        {/* === YOU'LL LOVE THIS IF / NOT FOR YOU === */}
        <section className="section">
          <div className="comparison-grid">
            <ComparisonCard
              title="You'll love this if…"
              items={[
                "You want autonomy and accountability",
                "You're comfortable being measured on outcomes",
                "You like building systems, not just executing tasks"
              ]}
              variant="positive"
            />
            <ComparisonCard
              title="This is not for you if…"
              items={[
                "You need heavy hand-holding",
                "You dislike feedback tied to performance",
                "You want a slow, corporate environment"
              ]}
              variant="negative"
            />
          </div>
        </section>

        {/* === WHAT WE DO === */}
        <section className="section">
          <div className="work-grid">
            <article className="card work-card">
              <img src="/adspend-logo.png" alt="Adspend Agency" className="work-card-logo" />
              <ul className="work-card-list green-bullets">
                <li>Performance advertising</li>
                <li>Creative testing</li>
                <li>Attribution & CRO</li>
                <li>Scaling real businesses with ads</li>
              </ul>
            </article>
            <article className="card work-card">
              <img src="/operatorhq-logo.png" alt="OperatorHQ AI" className="work-card-logo" />
              <ul className="work-card-list green-bullets">
                <li>Building AI infrastructure for businesses</li>
                <li>On-prem AI systems / Private LLMs</li>
                <li>Voice agents / RAG chat / AI agents</li>
                <li>Agentic business operating systems</li>
              </ul>
            </article>
          </div>
        </section>

        {/* === OPEN ROLES === */}
        <section className="section jobs-section" id="jobs">
          <h2>
            Open Roles
            {teamFilter && (
              <span className="section-filter-label">({teamFilter})</span>
            )}
          </h2>

          {/* Filters */}
          <div className="filters">
            <input
              type="text"
              className="filter-input"
              placeholder="Search title, team, keyword…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="filter-select"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All Orgs</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select
              ref={teamSelectRef}
              className="filter-select"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Jobs Grid - 2 COLUMNS */}
          {loading ? (
            <div className="loading">Loading roles...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="empty-state">
              <h3>No exact matches</h3>
              <p>Try adjusting your filters or join our Talent Network.</p>
              <button className="btn" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="jobs-grid two-columns">
              {filteredRoles.map((role) => (
                <JobCard
                  key={role.id}
                  role={role}
                  onClick={() => handleRoleClick(role)}
                />
              ))}
            </div>
          )}
        </section>

        {/* === WHAT WINNING LOOKS LIKE === */}
        <section className="section">
          <h2>What Winning Looks Like Here</h2>
          <article className="card" style={{ cursor: "default" }}>
            <h3 style={{ color: "var(--brand)", marginBottom: "16px" }}>How We Measure Success</h3>
            <ul style={{ paddingLeft: "20px", color: "var(--text-muted)" }}>
              <li style={{ marginBottom: "10px" }}>We care about outcomes, not activity</li>
              <li style={{ marginBottom: "10px" }}>Ownership matters more than job titles</li>
              <li>Clear goals, fast feedback, constant iteration</li>
            </ul>
          </article>
        </section>

        {/* === HIRING PROCESS === */}
        <section className="section">
          <h2>Hiring Process</h2>
          <div className="process-grid">
            <article className="card process-step">
              <h3>1. Apply</h3>
              <p>Submit your application with <strong>proof of work</strong>.</p>
            </article>
            <article className="card process-step">
              <h3>2. Review</h3>
              <p>Short async review by the team.</p>
            </article>
            <article className="card process-step">
              <h3>3. Paid Sprint</h3>
              <p>1–2 week scoped project (paid).</p>
            </article>
            <article className="card process-step">
              <h3>4. Offer</h3>
              <p>Full offer + onboarding.</p>
            </article>
          </div>
          <div className="process-note">
            <strong>Typical Timeline:</strong> 7–14 days from application to offer.
          </div>
        </section>

        {/* === TALENT NETWORK === */}
        <section className="section">
          <article className="card talent-cta">
            <h3>Don't See Your Role?</h3>
            <p>We're always meeting exceptional operators. Join the Talent Network and we'll reach out when there's a fit.</p>
            <HeartButton
              href="https://form.typeform.com/to/XG6oHXSn?source=talent_network"
              className="btn btn-brand"
            >
              Join Talent Network
            </HeartButton>
          </article>
        </section>

        {/* === WHY JOIN US === */}
        <section className="section">
          <h2>Why Join Us</h2>
          <div className="why-grid">
            <article className="card why-card">
              <h3>Autonomy & Impact</h3>
              <p>No bureaucracy. You own your outcomes. Ship fast, measure everything, and iterate like a founder.</p>
            </article>
            <article className="card why-card">
              <h3>High-Stakes Work</h3>
              <p>We manage 8-figure ad budgets and build AI systems that run companies. The pressure is real, and so are the rewards.</p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          {/* Centered nav links */}
          <nav className="footer-links-centered">
            <a href="mailto:careers@adspend.agency" className="footer-link">Contact</a>
            <a href="https://adspend.agency" target="_blank" rel="noopener noreferrer" className="footer-link">
              Adspend Agency
            </a>
            <a href="https://operatorai.agency" target="_blank" rel="noopener noreferrer" className="footer-link">
              OperatorHQ AI
            </a>
            <HeartButton
              href="https://form.typeform.com/to/XG6oHXSn?source=talent_network"
              className="footer-link"
            >
              Join Talent Network
            </HeartButton>
          </nav>
          {/* Centered Equal Opportunity */}
          <div className="footer-legal-centered">
            <strong>Equal Opportunity Employer.</strong> Adspend Agency and OperatorHQ AI are committed to creating a diverse environment. All qualified applicants will receive consideration for employment without regard to race, color, religion, gender, gender identity or expression, sexual orientation, national origin, genetics, disability, age, or veteran status.
          </div>
          {/* Footer Logos - side by side, with links */}
          <div className="footer-logos">
            <a href="https://adspend.agency" target="_blank" rel="noopener noreferrer">
              <img src="/adspend-logo.png" alt="Adspend Agency" className="footer-logo" />
            </a>
            <a href="https://operatorai.agency" target="_blank" rel="noopener noreferrer">
              <img src="/operatorhq-logo.png" alt="OperatorHQ AI" className="footer-logo" />
            </a>
          </div>
          <div className="footer-copyright-centered">
            © {new Date().getFullYear()} Adspend Agency & OperatorHQ AI
          </div>
        </div>
      </footer>

      {/* Modal */}
      <JobModal
        role={selectedRole}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
