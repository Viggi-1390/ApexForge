import { useEffect, useState, useCallback } from "react";
import { getTracks } from "../services/api";
import KineticGrid from "../components/ui/KineticGrid";
import PearlButton from "../components/ui/PearlButton";
import "./Tracks.css";

// ─── Default Track Fallback Image ──────────────────────────────────────────
const DEFAULT_TRACK_IMAGE =
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=750&fit=crop&q=80";

function Tracks({ onNavigate, selectedTrackId: currentSelectedId, onSelectTrack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [localSelectedTrackId, setLocalSelectedTrackId] = useState(null);
  const [imageError, setImageError] = useState({});

  const selectedTrackId = currentSelectedId ?? localSelectedTrackId;

  // ── Data fetching ───────────────────────────────────────────────────────
  const loadTracks = useCallback(() => {
    setLoading(true);
    setError("");
    getTracks()
      .then((data) => {
        setTracks(data);
        if (currentSelectedId) {
          const idx = data.findIndex((t) => t.trackId === currentSelectedId);
          if (idx !== -1) setActiveIndex(idx);
          else setActiveIndex(0);
        } else {
          setActiveIndex(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load circuits from the database.");
        setLoading(false);
      });
  }, [currentSelectedId]);

  useEffect(() => {
    let active = true;
    getTracks()
      .then((data) => {
        if (!active) return;
        setTracks(data);
        if (currentSelectedId) {
          const idx = data.findIndex((t) => t.trackId === currentSelectedId);
          if (idx !== -1) setActiveIndex(idx);
          else setActiveIndex(0);
        } else {
          setActiveIndex(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setError("Could not load circuits from the database.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentSelectedId]);

  // ── Carousel navigation ────────────────────────────────────────────────
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < tracks.length - 1;

  const handlePrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((i) => Math.min(tracks.length - 1, i + 1));
  }, [tracks.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // ── Selection ───────────────────────────────────────────────────────────
  const handleSelect = useCallback(() => {
    if (tracks.length === 0) return;
    const track = tracks[activeIndex];
    setLocalSelectedTrackId(track.trackId);
    if (typeof onSelectTrack === "function") {
      onSelectTrack(track);
    }
  }, [tracks, activeIndex, onSelectTrack]);

  // ── Active Track Specs ──────────────────────────────────────────────────
  const activeTrack = tracks[activeIndex] || null;
  const totalTracks = tracks.length;
  const displayIndex = String(activeIndex + 1).padStart(2, "0");
  const displayTotal = String(totalTracks).padStart(2, "0");

  // ── Shared Header ───────────────────────────────────────────────────────
  const header = (
    <header className="af-header">
      <div className="af-header-left">
        <span className="af-brand">APEXFORGE</span>
        <span className="af-version">SYS.V04</span>
        <span className="af-header-sep" />
        <nav className="af-nav" aria-label="Main navigation">
          <button
            type="button"
            className="af-nav-item"
            onClick={() => onNavigate && onNavigate("garage")}
            aria-label="Navigate to Garage"
          >
            GARAGE
          </button>
          <button
            type="button"
            className="af-nav-item af-nav-active"
            aria-current="page"
          >
            TRACKS
          </button>
          <button
            type="button"
            className="af-nav-item"
            onClick={() => onNavigate && onNavigate("engineering")}
            aria-label="Navigate to Telemetry Analysis"
          >
            ENGINEERING
          </button>
          <span className="af-nav-item" tabIndex={0}>
            ABOUT
          </span>
        </nav>
      </div>
      <div className="af-header-right">
        <span className="af-workspace-badge">
          <span className="af-workspace-dot" />
          WORKSPACE READY
        </span>
        <span className="af-avatar" aria-label="User profile" />
      </div>
    </header>
  );

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <KineticGrid globalColor="monochrome">
        <div className="af-page">
          {header}
          <div className="af-state-center">
            <div className="af-loader" />
            <p className="af-state-text">INITIALIZING TRACK DATABASE...</p>
          </div>
        </div>
      </KineticGrid>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <KineticGrid globalColor="monochrome">
        <div className="af-page">
          {header}
          <div className="af-state-center">
            <p className="af-state-text af-state-error">{error}</p>
            <button className="af-btn af-btn-retry" onClick={loadTracks}>
              RETRY CONNECTION
            </button>
          </div>
        </div>
      </KineticGrid>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (totalTracks === 0) {
    return (
      <KineticGrid globalColor="monochrome">
        <div className="af-page">
          {header}
          <div className="af-state-center">
            <p className="af-state-text">NO CIRCUITS AVAILABLE IN DATABASE</p>
            <p className="af-state-sub">
              Check database connectivity or import circuit geometry.
            </p>
          </div>
        </div>
      </KineticGrid>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────
  const isSelected = selectedTrackId === activeTrack?.trackId;

  return (
    <KineticGrid globalColor="monochrome">
      <div className="af-page">
        {header}

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="af-hero">
          <div className="af-eyebrow-row">
            <div className="af-eyebrow-left">
              <span className="af-eyebrow-red">
                <span className="af-eyebrow-square" />
                SYSTEM / CIRCUIT ALLOCATION
              </span>
              <span className="af-eyebrow-grey">TRACK DATABASE / READY</span>
            </div>
          </div>

          <div className="af-hero-content">
            <div className="af-hero-left">
              <h1 className="af-hero-title">CHOOSE YOUR CIRCUIT</h1>
              <p className="af-hero-subtitle">
                Select a circuit to initialize track geometry, surface conditions,
                racing lines, and telemetry visualization.
              </p>
            </div>
            <div className="af-hero-right">
              <span className="af-fleet-label">CIRCUIT SPEC</span>
              <span className="af-fleet-counter">
                {displayIndex} / {displayTotal} — ACTIVE CIRCUIT
              </span>
            </div>
          </div>

          <div className="af-divider" />
        </section>

        {/* ── Track Showcase Carousel ──────────────────────────────────── */}
        <section className="af-showcase">
          <div className="af-showcase-container">
            {/* Side micro-labels */}
            <div className="af-showcase-label af-showcase-label-left">
              <span>KNOWN CIRCUIT</span>
              <span
                className="af-showcase-action"
                role="button"
                tabIndex={0}
                onClick={handleSelect}
                onKeyDown={(e) => e.key === "Enter" && handleSelect()}
                aria-label={`Select ${activeTrack.name}`}
              >
                [SELECT]
              </span>
            </div>

            <div className="af-showcase-image-wrap">
              {!imageError[activeIndex] ? (
                <>
                  <img
                    src={activeTrack.imageUrl || DEFAULT_TRACK_IMAGE}
                    alt={activeTrack.name}
                    className="af-showcase-image"
                    draggable={false}
                    onError={() =>
                      setImageError((prev) => ({
                        ...prev,
                        [activeIndex]: true,
                      }))
                    }
                  />
                  <div className="af-showcase-overlay" />
                </>
              ) : (
                <div className="af-showcase-placeholder">
                  <span className="af-placeholder-text">
                    {activeTrack.name}
                  </span>
                  <span className="af-placeholder-sub">
                    {activeTrack.country}
                  </span>
                </div>
              )}
            </div>

            <div className="af-showcase-label af-showcase-label-right">
              <span>SURFACE TELEMETRY</span>
              <span className="af-showcase-action">[INSPECT]</span>
            </div>
          </div>
        </section>

        {/* ── Carousel Controls ───────────────────────────────────────── */}
        <section className="af-carousel-controls">
          <button
            className="af-btn af-btn-nav"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Previous circuit"
          >
            <span className="af-btn-arrow">←</span> PREV CIRCUIT
          </button>

          <div
            className="af-indicators"
            role="tablist"
            aria-label="Circuit carousel position indicators"
          >
            {tracks.map((t, i) => (
              <button
                key={t.trackId}
                className={
                  "af-indicator" +
                  (i === activeIndex ? " af-indicator-active" : "")
                }
                onClick={() => setActiveIndex(i)}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Circuit ${i + 1}: ${t.name}`}
              />
            ))}
          </div>

          <button
            className="af-btn af-btn-nav"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next circuit"
          >
            NEXT CIRCUIT <span className="af-btn-arrow">→</span>
          </button>
        </section>

        {/* ── Bottom Information Bar ──────────────────────────────────── */}
        <section className="af-bottom-bar">
          <div className="af-divider" />
          <div className="af-bottom-content">
            <div className="af-bottom-left">
              <span className="af-bottom-accent" />
              <span className="af-bottom-category">
                {activeTrack.name.toUpperCase()}
              </span>
              <span className="af-bottom-spec">
                {activeTrack.country ? activeTrack.country.toUpperCase() : "CIRCUIT"}
                {activeTrack.circuitType ? ` // ${activeTrack.circuitType.toUpperCase()}` : ""}
              </span>
            </div>

            <div className="af-bottom-right">
              <div className="af-bottom-telemetry-meta">
                {activeTrack.lengthKm && (
                  <span className="af-bottom-hp">
                    {activeTrack.lengthKm} KM
                  </span>
                )}
                {activeTrack.turns && (
                  <span className="af-bottom-hp">
                    {activeTrack.turns} TURNS
                  </span>
                )}
                {activeTrack.layoutVariant && (
                  <span className="af-bottom-spec">
                    {activeTrack.layoutVariant.toUpperCase()}
                  </span>
                )}
              </div>

              <PearlButton
                variant={isSelected ? "default" : "primary"}
                onClick={handleSelect}
                aria-label={
                  isSelected
                    ? `${activeTrack.name} selected`
                    : `Select ${activeTrack.name}`
                }
              >
                {isSelected ? "✓ SELECTED" : "SELECT TRACK"}
              </PearlButton>
            </div>
          </div>
        </section>
      </div>
    </KineticGrid>
  );
}

export default Tracks;
