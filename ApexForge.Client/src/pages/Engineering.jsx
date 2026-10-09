import { useState, useEffect, useCallback, useMemo } from "react";
import KineticGrid from "../components/ui/KineticGrid";
import PearlButton from "../components/ui/PearlButton";
import { useTelemetryPlayback } from "../hooks/useTelemetryPlayback";
import { getLatestTelemetry, getTelemetryAnalysis } from "../services/api";
import "./Engineering.css";

// ─── Default Baseline Sample Generator ─────────────────────────────────────
function generateBaselineTelemetry() {
  const samples = [];
  const totalSamples = 500;
  const trackLengthM = 7004.0;
  const totalDurationSec = 137.384;

  for (let i = 0; i < totalSamples; i++) {
    const progress = i / (totalSamples - 1);
    const timeSec = Math.round(progress * totalDurationSec * 1000) / 1000;
    const distM = Math.round(progress * trackLengthM * 100) / 100;
    const speed = Math.round(180 + Math.sin(progress * Math.PI * 6) * 70);
    const gear = Math.min(6, Math.max(1, Math.floor(speed / 45) + 1));
    const rpm = Math.min(9000, Math.round(5500 + (speed % 50) * 70));
    const throttle = speed > 210 ? 94 : Math.round((speed / 250) * 100);
    const brake = speed < 190 ? Math.round((200 - speed) * 1.2) : 0;
    const steering = Math.round(Math.sin(progress * Math.PI * 8) * 35 * 10) / 10;

    samples.push({
      sampleIndex: i,
      timestampSec: timeSec,
      distanceM: distM,
      speedKmh: Math.max(0, speed),
      rpm: rpm,
      gear: gear,
      throttlePct: Math.max(0, Math.min(100, throttle)),
      brakeBar: Math.max(0, Math.min(100, brake)),
      steeringDeg: Math.max(-180, Math.min(180, steering)),
      gLat: Math.round(Math.sin(progress * Math.PI * 8) * 2.2 * 100) / 100,
      gLon: Math.round(Math.cos(progress * Math.PI * 6) * 1.5 * 100) / 100,
    });
  }
  return samples;
}

export default function Engineering({ onNavigate, selectedVehicle, selectedTrack }) {
  const [telemetrySession, setTelemetrySession] = useState(null);
  const [telemetrySamples, setTelemetrySamples] = useState(() => generateBaselineTelemetry());
  
  // Graph controls state
  const [axisMode, setAxisMode] = useState("distance"); // 'distance' | 'time'
  const [visibleChannels, setVisibleChannels] = useState({
    speed: true,
    speedRef: true,
    throttle: true,
    brake: true,
    gear: true,
    steering: true,
  });

  // Graph hover inspection state
  const [hoverState, setHoverState] = useState({
    isHovering: false,
    mouseX: 0,
    pct: 0,
    sample: null,
  });

  // Telemetry Analysis Engine results state
  const [analysisResults, setAnalysisResults] = useState(null);

  // Fetch telemetry analysis recommendations when session changes
  useEffect(() => {
    let isSubscribed = true;
    if (telemetrySession?.sessionId) {
      getTelemetryAnalysis(telemetrySession.sessionId)
        .then((res) => {
          if (!isSubscribed) return;
          if (res && res.success && Array.isArray(res.results)) {
            setAnalysisResults(res.results);
          } else {
            setAnalysisResults(null);
          }
        })
        .catch(() => {
          if (isSubscribed) setAnalysisResults(null);
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [telemetrySession]);
  useEffect(() => {
    let isSubscribed = true;
    const vId = selectedVehicle?.vehicleId;
    const tId = selectedTrack?.trackId;

    getLatestTelemetry(vId, tId)
      .then((res) => {
        if (!isSubscribed) return;
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTelemetrySession(res);
          setTelemetrySamples(res.data);
        } else {
          setTelemetrySession(null);
          setTelemetrySamples(generateBaselineTelemetry());
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn("Could not load API telemetry session:", err);
        setTelemetrySession(null);
        setTelemetrySamples(generateBaselineTelemetry());
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedVehicle?.vehicleId, selectedTrack?.trackId]);

  // Unified Playback Engine Hook (Milestone 2)
  const {
    isPlaying,
    playbackSpeed,
    playbackElapsedSec,
    totalDurationSec,
    totalDistanceM,
    firstTimestamp,
    interpolatedValues,
    play,
    pause,
    reset,
    seekToElapsedSec,
    seekToDistanceM,
    setPlaybackSpeed,
  } = useTelemetryPlayback(telemetrySamples, 1.0);

  // Playhead percentage position
  const playheadPct =
    axisMode === "time"
      ? totalDurationSec > 0
        ? (playbackElapsedSec / totalDurationSec) * 100
        : 0
      : totalDistanceM > 0
      ? ((interpolatedValues.distanceM ?? 0) / totalDistanceM) * 100
      : 0;

  // Memoized SVG Path calculations for 60 FPS graph performance
  const graphPaths = useMemo(() => {
    if (!telemetrySamples || telemetrySamples.length < 2) {
      return { speed: "", throttle: "", brake: "", gear: "", steering: "" };
    }

    const totalDist = totalDistanceM || 1;
    const totalTime = totalDurationSec || 1;

    const speedPts = [];
    const thrPts = [];
    const brkPts = [];
    const gearPts = [];
    const steerPts = [];

    for (let i = 0; i < telemetrySamples.length; i++) {
      const s = telemetrySamples[i];
      const rawX =
        axisMode === "time"
          ? ((s.timestampSec ?? s.t ?? 0) - firstTimestamp) / totalTime
          : (s.distanceM ?? s.lapDist ?? 0) / totalDist;
      const x = Math.max(0, Math.min(1000, Math.round(rawX * 1000 * 10) / 10));

      const speedY = Math.round((1 - (s.speedKmh ?? s.speed ?? 0) / 320) * 120 * 10) / 10;
      const thrY = Math.round((1 - (s.throttlePct ?? s.thr ?? 0) / 100) * 100 * 10) / 10;
      const brkY = Math.round((1 - (s.brakeBar ?? s.brk ?? 0) / 100) * 100 * 10) / 10;
      const gearY = Math.round((1 - (s.gear ?? 0) / 8) * 80 * 10) / 10;
      const steerY = Math.round((0.5 - (s.steeringDeg ?? s.steer ?? 0) / 120) * 80 * 10) / 10;

      speedPts.push(`${x},${speedY}`);
      thrPts.push(`${x},${thrY}`);
      brkPts.push(`${x},${brkY}`);
      gearPts.push(`${x},${gearY}`);
      steerPts.push(`${x},${steerY}`);
    }

    return {
      speed: "M " + speedPts.join(" L "),
      throttle: "M " + thrPts.join(" L "),
      brake: "M " + brkPts.join(" L "),
      gear: "M " + gearPts.join(" L "),
      steering: "M " + steerPts.join(" L "),
    };
  }, [telemetrySamples, axisMode, totalDistanceM, totalDurationSec, firstTimestamp]);

  // Channel Toggle Handler
  const toggleChannel = useCallback((channelKey) => {
    setVisibleChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  }, []);

  // Hover inspection over graph workspace
  const handleGraphMouseMove = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));

      let closestSample = telemetrySamples[0];
      if (axisMode === "time") {
        const targetTime = firstTimestamp + pct * totalDurationSec;
        let minDiff = Infinity;
        for (let i = 0; i < telemetrySamples.length; i++) {
          const diff = Math.abs((telemetrySamples[i].timestampSec ?? 0) - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestSample = telemetrySamples[i];
          }
        }
      } else {
        const targetDist = pct * totalDistanceM;
        let minDiff = Infinity;
        for (let i = 0; i < telemetrySamples.length; i++) {
          const diff = Math.abs((telemetrySamples[i].distanceM ?? 0) - targetDist);
          if (diff < minDiff) {
            minDiff = diff;
            closestSample = telemetrySamples[i];
          }
        }
      }

      setHoverState({
        isHovering: true,
        mouseX: clickX,
        pct: pct * 100,
        sample: closestSample,
      });
    },
    [telemetrySamples, axisMode, firstTimestamp, totalDurationSec, totalDistanceM]
  );

  const handleGraphMouseLeave = useCallback(() => {
    setHoverState({
      isHovering: false,
      mouseX: 0,
      pct: 0,
      sample: null,
    });
  }, []);

  // Interactive Click-to-Seek Handler
  const handleGraphClick = useCallback(
    (e) => {
      // Prevent seeking when clicking channel toggle buttons
      if (e.target.closest("button")) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));

      if (axisMode === "time") {
        seekToElapsedSec(pct * totalDurationSec);
      } else {
        seekToDistanceM(pct * totalDistanceM);
      }
    },
    [axisMode, totalDurationSec, totalDistanceM, seekToElapsedSec, seekToDistanceM]
  );

  // Interactive Scrubber Click Handler
  const handleScrubberClick = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      seekToElapsedSec(pct * totalDurationSec);
    },
    [totalDurationSec, seekToElapsedSec]
  );

  // Track-aware Sector/Turn markers
  const trackMarkers = useMemo(() => {
    const tName = (selectedTrack?.name || "").toLowerCase();
    if (tName.includes("silverstone")) {
      return [
        { label: "0M // HAMILTON STRAIGHT", pct: 0 },
        { label: "650M // ABBEY", pct: 11 },
        { label: "1,800M // THE LOOP", pct: 30 },
        { label: "2,900M // WELLINGTON", pct: 49 },
        { label: "3,700M // LUFFIELD", pct: 62 },
        { label: "4,600M // WOODCOTE", pct: 78 },
        { label: "5,891M // COPSE", pct: 100 },
      ];
    }
    if (tName.includes("monza")) {
      return [
        { label: "0M // RETTIFILO", pct: 0 },
        { label: "1,100M // VARIANTE RETTIFILO", pct: 19 },
        { label: "2,400M // CURVA GRANDE", pct: 41 },
        { label: "3,500M // VARIANTE ROGGIA", pct: 60 },
        { label: "4,600M // LESMO", pct: 79 },
        { label: "5,793M // PARABOLICA", pct: 100 },
      ];
    }
    // Default Spa-Francorchamps layout
    return [
      { label: "0M // T1 LA SOURCE", pct: 0 },
      { label: "1,050M // EAU ROUGE", pct: 15 },
      { label: "2,200M // KEMMEL", pct: 31 },
      { label: "3,350M // LES COMBES", pct: 48 },
      { label: "4,400M // POUHON", pct: 63 },
      { label: "4,820M // T14 CAMPUS", pct: 68.8, highlight: true },
      { label: "5,900M // BLANCHIMONT", pct: 84 },
      { label: "7,004M // BUS STOP", pct: 100 },
    ];
  }, [selectedTrack?.name]);

  // Dynamic Car vs Bike Vehicle Detection (Structured primary with justified model name fallback)
  const isBike = useMemo(() => {
    if (!selectedVehicle && !telemetrySession?.vehicle) return false;
    const vCategory = (
      selectedVehicle?.category ||
      selectedVehicle?.vehicleType ||
      telemetrySession?.vehicle?.Class ||
      telemetrySession?.vehicle?.VehicleType ||
      ""
    ).toString().toLowerCase();

    // 1. Structured Category Check (Primary)
    if (vCategory.includes("bike") || vCategory.includes("motorcycle") || vCategory.includes("motogp") || vCategory.includes("superbike")) {
      return true;
    }
    if (vCategory.includes("car") || vCategory.includes("gt3") || vCategory.includes("gt4") || vCategory.includes("gtp") || vCategory.includes("lmdh") || vCategory.includes("f1")) {
      return false;
    }

    // 2. Justified Fallback: Specific model name keywords
    const vName = (selectedVehicle?.name || telemetrySession?.vehicle?.Name || "").toString().toLowerCase();
    const bikeModelKeywords = ["yamaha m1", "honda cbr", "ducati v4r", "kawasaki zx10r", "yamaha r1", "desmosedici", "ktm rc", "bmw m1000rr"];
    return bikeModelKeywords.some((keyword) => vName.includes(keyword));
  }, [selectedVehicle, telemetrySession]);

  // Dynamic Maximum Lean Angle Calculation from actual session samples
  const liveMaxLean = useMemo(() => {
    if (!telemetrySamples || telemetrySamples.length === 0) return "N/A";
    let maxLean = 0;
    for (let i = 0; i < telemetrySamples.length; i++) {
      const s = telemetrySamples[i];
      const absLean = Math.abs(s.steeringDeg ?? (s.gLat ? s.gLat * 22 : 0));
      if (!isNaN(absLean) && isFinite(absLean) && absLean > maxLean) {
        maxLean = absLean;
      }
    }
    return maxLean > 0 ? `${Math.min(65, Math.round(maxLean * 10) / 10)}°` : "48.2°";
  }, [telemetrySamples]);

  // Derived display values
  const vehicleName = selectedVehicle?.name || telemetrySession?.vehicle?.Name || "APEX VALKYRIE";
  const vehicleCat = selectedVehicle?.category || telemetrySession?.vehicle?.Class || "GT3 SPEC";
  const trackName = selectedTrack?.name || telemetrySession?.track?.Name || "SPA-FRANCORCHAMPS";
  const trackLength = selectedTrack?.lengthKm
    ? `${selectedTrack.lengthKm} KM`
    : telemetrySession?.track?.Length
    ? `${telemetrySession.track.Length} KM`
    : "7.004 KM";

  // Dynamic Circuit Dot Position along SVG trajectory (0-100% playhead progress)
  const circuitDotPos = useMemo(() => {
    const normPct = Math.max(0, Math.min(100, playheadPct));
    const tName = (trackName || "").toLowerCase();

    if (tName.includes("silverstone")) {
      if (normPct < 20) return { x: 80 + (normPct / 20) * 100, y: 220 - (normPct / 20) * 40 };
      if (normPct < 50) return { x: 180 + ((normPct - 20) / 30) * 140, y: 180 - ((normPct - 20) / 30) * 110 };
      if (normPct < 80) return { x: 320 + ((normPct - 50) / 30) * 100, y: 70 + ((normPct - 50) / 30) * 100 };
      return { x: 420 - ((normPct - 80) / 20) * 340, y: 170 + ((normPct - 80) / 20) * 50 };
    }

    if (tName.includes("monza")) {
      if (normPct < 25) return { x: 80 + (normPct / 25) * 320, y: 240 };
      if (normPct < 50) return { x: 400 + ((normPct - 25) / 25) * 40, y: 240 - ((normPct - 25) / 25) * 160 };
      if (normPct < 75) return { x: 440 - ((normPct - 50) / 25) * 320, y: 80 };
      return { x: 120 - ((normPct - 75) / 25) * 40, y: 80 + ((normPct - 75) / 25) * 160 };
    }

    // Default Spa-Francorchamps checkpoints
    if (normPct < 15) return { x: 90 - (normPct / 15) * 10, y: 200 - (normPct / 15) * 80 };
    if (normPct < 30) return { x: 80 + ((normPct - 15) / 15) * 65, y: 120 - ((normPct - 15) / 15) * 25 };
    if (normPct < 50) return { x: 145 + ((normPct - 30) / 20) * 165, y: 95 - ((normPct - 30) / 20) * 5 };
    if (normPct < 70) return { x: 310 + ((normPct - 50) / 20) * 35, y: 90 + ((normPct - 50) / 20) * 130 };
    if (normPct < 85) return { x: 345 + ((normPct - 70) / 15) * 75, y: 220 + ((normPct - 70) / 15) * 10 };
    return { x: 420 - ((normPct - 85) / 15) * 330, y: 230 - ((normPct - 85) / 15) * 30 };
  }, [trackName, playheadPct]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = (secs % 60).toFixed(3);
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(6, "0")}`;
  };

  // Synchronized telemetry values derived from playback engine
  const liveSpeed = interpolatedValues.speedKmh;
  const liveGear = interpolatedValues.gear;
  const liveRpm = interpolatedValues.rpm;
  const liveThrottle = interpolatedValues.throttlePct;
  const liveBrake = interpolatedValues.brakeBar;
  const liveSteering = interpolatedValues.steeringDeg;
  const liveDistanceM = interpolatedValues.distanceM;

  return (
    <KineticGrid globalColor="monochrome">
      <div className="af-page af-engineering-page">
        {/* ── Header ────────────────────────────────────────────────── */}
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
              >
                GARAGE
              </button>
              <button
                type="button"
                className="af-nav-item"
                onClick={() => onNavigate && onNavigate("tracks")}
              >
                TRACKS
              </button>
              <button
                type="button"
                className="af-nav-item af-nav-active"
                aria-current="page"
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

        {/* ── System Status Banner ──────────────────────────────────── */}
        <section className="eng-status-banner">
          <div className="eng-status-left">
            <span className="eng-chip">[ SYSTEM // TELEMETRY_INGEST ]</span>
            <span className="eng-chip">[ GRID // 04-REG: SYNCHRONIZED ]</span>
            <span className="eng-chip eng-chip-active">
              <span className="eng-pulse-dot" />
              INGESTION: 1000HZ VERIFIED
            </span>
          </div>
          <div className="eng-status-right">
            <span>PORT: RAW.CAN-FD-01</span>
            <span className="eng-dot-sep">•</span>
            <span className="eng-text-white">
              BUFFER: {telemetrySession?.isDemoData ? "DEMO TELEMETRY" : "99.8% REAL-TIME"}
            </span>
          </div>
        </section>

        {/* ── Selection Pending Notice Bar ──────────────────────────── */}
        {(!selectedVehicle || !selectedTrack) && (
          <section className="eng-notice-banner">
            <div className="eng-notice-banner-left">
              <span className="eng-notice-badge">SELECTION PENDING</span>
              <span className="eng-notice-msg">
                {!selectedVehicle && !selectedTrack
                  ? "No vehicle or circuit selected. Viewing default baseline telemetry context."
                  : !selectedVehicle
                  ? "No vehicle platform selected. Viewing default APEX VALKYRIE baseline."
                  : "No circuit platform selected. Viewing default SPA-FRANCORCHAMPS baseline."}
              </span>
            </div>
            <div className="eng-notice-banner-right">
              {!selectedVehicle && (
                <PearlButton variant="primary" onClick={() => onNavigate && onNavigate("garage")}>
                  SELECT VEHICLE
                </PearlButton>
              )}
              {!selectedTrack && (
                <PearlButton variant="primary" onClick={() => onNavigate && onNavigate("tracks")}>
                  SELECT TRACK
                </PearlButton>
              )}
            </div>
          </section>
        )}

        {/* ── Page Title & Action Bar ───────────────────────────────── */}
        <section className="eng-title-section">
          <div className="eng-title-left">
            <h1 className="eng-title">TELEMETRY ANALYSIS</h1>
            <p className="eng-subtitle">
              Analyze vehicle dynamic envelope, chassis load dispersion, and
              instantaneous sector delta across {trackName}.
            </p>
          </div>
          <div className="eng-title-actions">
            <PearlButton icon="📂">LOAD SESSION</PearlButton>
            <PearlButton variant="primary" icon="🔴">
              ANALYZE LAP
            </PearlButton>
          </div>
        </section>

        {/* ── Session HUD Strip ─────────────────────────────────────── */}
        <section className="eng-hud-strip">
          <div className="eng-hud-cell">
            <span className="eng-hud-label">VEHICLE PLATFORM</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val">{vehicleName.toUpperCase()}</span>
              <span className="eng-hud-tag-red">{vehicleCat.toUpperCase()}</span>
            </div>
          </div>

          <div className="eng-hud-cell">
            <span className="eng-hud-label">CIRCUIT // LAYOUT</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val">{trackName.toUpperCase()}</span>
              <span className="eng-hud-tag-grey">{trackLength}</span>
            </div>
          </div>

          <div className="eng-hud-cell">
            <span className="eng-hud-label">STINT / CURRENT LAP</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val">
                LAP 04 <span className="eng-hud-sub-val">/ 18</span>
              </span>
              <span className="eng-hud-tag-red">BEST: 2:17.384</span>
            </div>
          </div>

          <div className="eng-hud-cell">
            <span className="eng-hud-label">SESSION RUN ID</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val">
                {telemetrySession ? `S-2026-${telemetrySession.sessionId}` : "S-2025-WEC-09B"}
              </span>
              <span className="eng-hud-tag-grey">DRY // T:28.4°C</span>
            </div>
          </div>

          <div className="eng-hud-cell">
            <span className="eng-hud-label">DELTA VS REFERENCE</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val eng-red-text">+0.142s</span>
              <span className="eng-hud-tag-grey">SECTOR 2 OUT</span>
            </div>
          </div>

          <div className="eng-hud-cell">
            <span className="eng-hud-label">AERO BIAS BALANCE</span>
            <div className="eng-hud-value-row">
              <span className="eng-hud-main-val">
                48.5% F <span className="eng-hud-sub-val">/ 51.5% R</span>
              </span>
              <span className="eng-hud-tag-grey">DF: 1,420 KG</span>
            </div>
          </div>
        </section>

        {/* ── Top 3-Column Stage ────────────────────────────────────── */}
        <section className="eng-stage-grid">
          {/* Column 1: Chassis Wireframe & Tyres (4 cols) */}
          <div className="eng-panel eng-chassis-panel">
            <div className="eng-panel-header">
              <span className="eng-panel-title">
                <span className="eng-red-sq" />
                {isBike ? "SYS-CHASSIS // MOTORCYCLE TYRE & LEAN MAP" : "SYS-CHASSIS // TYRE & DOWNFORCE MAP"}
              </span>
              <span className="eng-panel-meta">{isBike ? `LEAN: ${liveMaxLean} MAX` : "AXIS: Z-Y-X"}</span>
            </div>

            {isBike ? (
              /* Motorcycle Chassis & Tyre Map */
              <div className="eng-chassis-schematic eng-bike-schematic">
                <svg className="eng-chassis-svg" viewBox="0 0 200 280" fill="none" stroke="currentColor">
                  <path d="M100 20 V260" opacity="0.2" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" />
                  {/* Front Wheel */}
                  <rect x="91" y="25" width="18" height="45" rx="4" fill="#201f21" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Handlebars */}
                  <line x1="60" y1="50" x2="140" y2="50" stroke="#e11d24" strokeWidth="2.5" />
                  {/* Frame & Tank Body */}
                  <path d="M95 50 L75 110 L85 180 L95 210 H105 L115 180 L125 110 Z" fill="#131315" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
                  <path d="M85 110 Q100 85 115 110" fill="none" stroke="#e11d24" strokeWidth="1.5" />
                  {/* Rear Wheel */}
                  <rect x="89" y="210" width="22" height="50" rx="4" fill="#201f21" stroke="#ffffff" strokeWidth="1.5" />
                </svg>

                {/* Bike Front Tyre Node */}
                <div className="eng-tyre-badge eng-tyre-fl" style={{ top: "35px", left: "10px" }}>
                  <span className="eng-tyre-label">FRONT TYRE</span>
                  <span className="eng-tyre-val">
                    81°C <span className="eng-tyre-sub">| 2.15 BAR</span>
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "92%" }} />
                  </div>
                </div>

                {/* Bike Rear Tyre Node */}
                <div className="eng-tyre-badge eng-tyre-fr" style={{ bottom: "45px", right: "10px" }}>
                  <span className="eng-tyre-label">REAR TYRE</span>
                  <span className="eng-tyre-val">
                    <span className="eng-tyre-sub">1.65 BAR | </span>88°C
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "96%" }} />
                  </div>
                </div>
              </div>
            ) : (
              /* Car GT3 Chassis & 4-Corner Tyre Map */
              <div className="eng-chassis-schematic">
                <svg className="eng-chassis-svg" viewBox="0 0 200 280" fill="none" stroke="currentColor">
                  <path
                    d="M20 140 H180 M100 20 V260"
                    opacity="0.2"
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="0.75"
                  />
                  <path
                    d="M60 40 L80 20 H120 L140 40 L155 70 L160 120 L155 170 L162 210 L160 250 L140 260 H60 L40 250 L38 210 L45 170 L40 120 L45 70 Z"
                    fill="#131315"
                    fillOpacity="0.9"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M75 90 L85 75 H115 L125 90 L125 155 L115 165 H85 L75 155 Z"
                    fill="#1c1b1d"
                    stroke="rgba(255,255,255,0.4)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <line x1="50" y1="20" x2="150" y2="20" stroke="#e11d24" strokeWidth="2.5" />
                  <line x1="40" y1="262" x2="160" y2="262" stroke="#e11d24" strokeWidth="3" />
                  <line x1="60" y1="65" x2="35" y2="65" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  <line x1="140" y1="65" x2="165" y2="65" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  <line x1="60" y1="220" x2="35" y2="220" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  <line x1="140" y1="220" x2="165" y2="220" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  <rect x="20" y="48" width="16" height="34" fill="#201f21" stroke="#fff" strokeWidth="1" />
                  <rect x="164" y="48" width="16" height="34" fill="#201f21" stroke="#fff" strokeWidth="1" />
                  <rect x="20" y="202" width="16" height="38" fill="#201f21" stroke="#fff" strokeWidth="1" />
                  <rect x="164" y="202" width="16" height="38" fill="#201f21" stroke="#fff" strokeWidth="1" />
                </svg>

                {/* Tyre Overlay Badges */}
                <div className="eng-tyre-badge eng-tyre-fl">
                  <span className="eng-tyre-label">FL // TYRE</span>
                  <span className="eng-tyre-val">
                    88°C <span className="eng-tyre-sub">| 1.88 BAR</span>
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="eng-tyre-badge eng-tyre-fr">
                  <span className="eng-tyre-label">FR // TYRE</span>
                  <span className="eng-tyre-val">
                    <span className="eng-tyre-sub">1.92 BAR | </span>91°C
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "84%" }} />
                  </div>
                </div>

                <div className="eng-tyre-badge eng-tyre-rl">
                  <span className="eng-tyre-label">RL // TYRE</span>
                  <span className="eng-tyre-val">
                    94°C <span className="eng-tyre-sub">| 1.95 BAR</span>
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "88%" }} />
                  </div>
                </div>

                <div className="eng-tyre-badge eng-tyre-rr">
                  <span className="eng-tyre-label">RR // TYRE</span>
                  <span className="eng-tyre-val">
                    <span className="eng-tyre-sub">1.94 BAR | </span>92°C
                  </span>
                  <div className="eng-tyre-meter">
                    <div className="eng-tyre-bar" style={{ width: "82%" }} />
                  </div>
                </div>
              </div>
            )}

            <div className="eng-chassis-footer">
              <div>
                <span className="eng-chassis-lbl">{isBike ? "FORK/SHOCK" : "RIDE H (F/R)"}</span>
                <span className="eng-chassis-val">{isBike ? "110mm / 45mm" : "32mm / 48mm"}</span>
              </div>
              <div>
                <span className="eng-chassis-lbl">{isBike ? "LEAN ANGLE" : "BRAKE BIAS"}</span>
                <span className="eng-chassis-val">{isBike ? `${liveMaxLean} MAX` : "57.4% FRONT"}</span>
              </div>
              <div>
                <span className="eng-chassis-lbl">{isBike ? "FRONT LEVER" : "DAMPER VEL"}</span>
                <span className="eng-chassis-val">{isBike ? "6.2 BAR P" : "+14.2 mm/s"}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Circuit Trajectory (5 cols) */}
          <div className="eng-panel eng-circuit-panel">
            <div className="eng-panel-header">
              <span className="eng-panel-title">
                <span className="eng-red-sq" />
                CIRCUIT TRAJECTORY // {trackName.toUpperCase()}
              </span>
              <span className="eng-panel-badge">LOC: TURN 14 (STAVELOT)</span>
            </div>

            <div className="eng-circuit-svg-wrap">
              <svg className="eng-circuit-svg" viewBox="0 0 500 280" fill="none">
                <text x="75" y="60" className="eng-svg-sect-text">
                  SECTOR 1 (LA SOURCE - RADILLON)
                </text>
                <text x="260" y="35" className="eng-svg-sect-text">
                  SECTOR 2 (LES COMBES - POUHON)
                </text>
                <text x="340" y="240" className="eng-svg-sect-text">
                  SECTOR 3 (BLANCHIMONT)
                </text>

                {/* Circuit Track Path Geometry */}
                <path
                  d="M 90 200 L 80 180 C 70 160, 65 140, 80 120 L 110 125 L 145 95 C 160 80, 185 85, 210 90 L 310 90 C 340 90, 360 80, 375 95 L 395 125 C 405 140, 380 155, 360 150 L 330 145 C 305 140, 290 160, 305 180 L 345 220 C 365 240, 390 240, 420 230 L 460 215 C 480 205, 470 175, 450 160 L 390 120 M 90 200 L 100 220 C 120 245, 160 250, 200 250 L 320 250 L 350 250"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Reference Lap White Trail */}
                <path
                  d="M 90 200 L 80 180 C 70 160, 65 140, 80 120 L 110 125 L 145 95 C 160 80, 185 85, 210 90 L 310 90 C 340 90, 360 80, 375 95 L 395 125 C 405 140, 380 155, 360 150 L 330 145 C 305 140, 290 160, 305 180 L 345 220"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active Vehicle Location Dot Driven Synchronously by Playback */}
                <circle cx={circuitDotPos.x} cy={circuitDotPos.y} r="5" fill="#e11d24" opacity="0.75" className="eng-ping" />
                <circle cx={circuitDotPos.x} cy={circuitDotPos.y} r="4.5" fill="#e11d24" stroke="#ffffff" strokeWidth="1.5" />

                {/* Callout HUD Box */}
                <line x1={circuitDotPos.x} y1={circuitDotPos.y} x2={Math.min(400, circuitDotPos.x + 40)} y2={Math.max(40, circuitDotPos.y - 35)} stroke="#e11d24" strokeWidth="1" />
                <rect x={Math.min(390, circuitDotPos.x + 40)} y={Math.max(25, circuitDotPos.y - 52)} width="105" height="26" fill="#131315" stroke="#e11d24" strokeWidth="1" />
                <text x={Math.min(397, circuitDotPos.x + 47)} y={Math.max(41, circuitDotPos.y - 36)} fill="#ffffff" className="eng-svg-callout-text">
                  {liveSpeed} KM/H // G{liveGear === 0 ? "N" : liveGear}
                </text>
              </svg>
            </div>

            <div className="eng-circuit-footer">
              <div>
                <span className="eng-lbl-grey">TRACK ELEVATION DELTA: </span>
                <span className="eng-val-white">+102.4 M (EAU ROUGE PEAK)</span>
              </div>
              <div className="eng-pos-indicator">
                <span className="eng-red-sq" />
                <span>CAR POS: {liveDistanceM.toLocaleString()} M</span>
              </div>
            </div>
          </div>

          {/* Column 3: Flight Instruments HUD (3 cols) */}
          <div className="eng-panel eng-hud-panel">
            <div className="eng-panel-header">
              <span className="eng-panel-title">
                <span className="eng-red-sq" />
                HUD // FLIGHT INSTRUMENTS
              </span>
              <span className="eng-panel-meta">LIVE BUS</span>
            </div>

            {/* Speed & Gear Blocks Synchronized to Playback Engine */}
            <div className="eng-hud-blocks-grid">
              <div className="eng-hud-block">
                <span className="eng-hud-blk-lbl">SPEED KM/H</span>
                <span className="eng-hud-speed-num">{liveSpeed}</span>
                <span className="eng-hud-blk-sub">REF: 246 KM/H</span>
              </div>
              <div className="eng-hud-block">
                <div className="eng-hud-blk-header">
                  <span className="eng-hud-blk-lbl">GEAR</span>
                  <span className="eng-hud-seq-lbl">SEQ-6</span>
                </div>
                <span className="eng-hud-gear-num">{liveGear === 0 ? "N" : liveGear}</span>
                <span className="eng-hud-blk-sub">CLUTCH: LOCKED</span>
              </div>
            </div>

            {/* Engine RPM Shift Lights */}
            <div className="eng-rpm-section">
              <div className="eng-rpm-row">
                <span>
                  ENGINE RPM: <strong>{liveRpm.toLocaleString()}</strong>
                </span>
                <span>LIMIT: 9,000</span>
              </div>
              <div className="eng-rpm-bar-container">
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-active" />
                <div className="eng-rpm-segment eng-rpm-red" />
                <div className="eng-rpm-segment eng-rpm-red" />
                <div className="eng-rpm-segment" />
              </div>
            </div>

            {/* Throttle & Brake Bars */}
            <div className="eng-pedals-section">
              <div className="eng-pedal-row">
                <div className="eng-pedal-lbl-row">
                  <span>THROTTLE [TPS]</span>
                  <strong>{liveThrottle}%</strong>
                </div>
                <div className="eng-pedal-track">
                  <div className="eng-pedal-fill-white" style={{ width: `${liveThrottle}%` }} />
                </div>
              </div>

              <div className="eng-pedal-row">
                <div className="eng-pedal-lbl-row">
                  <span>BRAKE PRESSURE [P-MAX]</span>
                  <span className="eng-red-val">{liveBrake} BAR ({liveBrake > 0 ? "42%" : "0%"})</span>
                </div>
                <div className="eng-pedal-track">
                  <div className="eng-pedal-fill-red" style={{ width: liveBrake > 0 ? "42%" : "0%" }} />
                </div>
              </div>
            </div>

            {/* Steering & G-G Diagram Mini */}
            <div className="eng-steer-gg-row">
              <div>
                <span className="eng-lbl-grey">STEERING</span>
                <div className="eng-steer-val">{liveSteering}°</div>
                <span className="eng-lbl-sub">CORRECTION: 0.0°</span>
              </div>
              <div className="eng-gg-plot">
                <div className="eng-gg-cross-h" />
                <div className="eng-gg-cross-v" />
                <div className="eng-gg-ring" />
                <div className="eng-gg-dot" />
                <span className="eng-gg-text">2.14G</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Multi-Channel Telemetry Graph Stack (Milestone 3) ───────── */}
        <section className="eng-panel eng-graph-workspace">
          <div className="eng-panel-header">
            <div className="eng-graph-title-row">
              <h2 className="eng-graph-h2">MULTI-CHANNEL TELEMETRY STACK</h2>
              <button
                type="button"
                className="eng-graph-tag eng-axis-toggle-btn"
                onClick={() => setAxisMode(axisMode === "distance" ? "time" : "distance")}
                title="Toggle Horizontal Axis Mode (Distance vs Time)"
              >
                SYNCED {axisMode.toUpperCase()} BASE ⇄
              </button>
            </div>

            {/* Interactive Channel Visibility Toggles */}
            <div className="eng-trace-legends">
              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.speed ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("speed")}
              >
                <span className="eng-leg-line eng-leg-white" />
                SPEED (KM/H)
              </button>

              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.speedRef ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("speedRef")}
              >
                <span className="eng-leg-line eng-leg-dash" />
                SPEED REF
              </button>

              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.throttle ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("throttle")}
              >
                <span className="eng-leg-line eng-leg-white" />
                THROTTLE (%)
              </button>

              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.brake ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("brake")}
              >
                <span className="eng-leg-line eng-leg-red" />
                BRAKE (BAR)
              </button>

              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.gear ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("gear")}
              >
                <span className="eng-leg-line eng-leg-grey" />
                GEAR
              </button>

              <button
                type="button"
                className={`eng-legend-btn ${visibleChannels.steering ? "eng-leg-active" : ""}`}
                onClick={() => toggleChannel("steering")}
              >
                <span className="eng-leg-line eng-leg-grey" />
                STEER (DEG)
              </button>
            </div>
          </div>

          {/* Graph Stack Workspace Container with Interactive Inspection */}
          <div
            className="eng-graph-container position-relative"
            onMouseMove={handleGraphMouseMove}
            onMouseLeave={handleGraphMouseLeave}
            onClick={handleGraphClick}
          >
            {/* Background Vertical Grid Hairlines */}
            <div className="eng-graph-grid">
              <div className="eng-grid-line" />
              <div className="eng-grid-line" />
              <div className="eng-grid-line" />
              <div className="eng-grid-line" />
              <div className="eng-grid-line" />
              <div className="eng-grid-line" />
            </div>

            {/* Interactive Vertical Red Playhead Hairline Driven Synchronously */}
            <div className="eng-playhead" style={{ left: `${playheadPct}%` }}>
              <div className="eng-playhead-tooltip">
                <div className="eng-ph-red font-bold">
                  POS: {liveDistanceM.toLocaleString()} M // {formatTime(playbackElapsedSec)}
                </div>
                <div className="eng-ph-white">
                  V: {liveSpeed} KM/H <span className="eng-ph-red">(Δ +1.8)</span>
                </div>
                <div className="eng-ph-grey">
                  THR: {liveThrottle}% | BRK: {liveBrake} BAR | G{liveGear === 0 ? "N" : liveGear} | STR: {liveSteering}°
                </div>
              </div>
            </div>

            {/* Hover Crosshair Overlay Line & HUD Tooltip */}
            {hoverState.isHovering && hoverState.sample && (
              <div className="eng-hover-crosshair" style={{ left: `${hoverState.mouseX}px` }}>
                <div className="eng-hover-tooltip">
                  <div className="eng-ht-head">HOVER INSPECT</div>
                  <div>DIST: {(hoverState.sample.distanceM ?? hoverState.sample.lapDist ?? 0).toLocaleString()} M</div>
                  <div>TIME: {formatTime(Math.max(0, (hoverState.sample.timestampSec ?? hoverState.sample.t ?? 0) - firstTimestamp))}</div>
                  <div className="eng-ht-vals">
                    <span>V: {hoverState.sample.speedKmh ?? hoverState.sample.speed ?? 0} KM/H</span>
                    <span>THR: {hoverState.sample.throttlePct ?? hoverState.sample.thr ?? 0}%</span>
                    <span>BRK: {hoverState.sample.brakeBar ?? hoverState.sample.brk ?? 0} BAR</span>
                    <span>G{hoverState.sample.gear ?? 1}</span>
                    <span>STR: {hoverState.sample.steeringDeg ?? hoverState.sample.steer ?? 0}°</span>
                  </div>
                  <div className="eng-ht-hint">Click to seek playback</div>
                </div>
              </div>
            )}

            {/* Vertically Stacked SVG Channels */}
            <div className="eng-channels-stack">
              {/* Channel 1: Speed */}
              {visibleChannels.speed && (
                <div className="eng-channel-row eng-ch-speed">
                  <div className="eng-y-axis">
                    <span className="eng-y-top">320</span>
                    <span>240</span>
                    <span>160</span>
                    <span>80</span>
                    <span>0 KM/H</span>
                  </div>
                  <div className="eng-ch-graph">
                    <svg className="eng-ch-svg" preserveAspectRatio="none" viewBox="0 0 1000 120">
                      <line x1="0" y1="30" x2="1000" y2="30" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="90" x2="1000" y2="90" stroke="rgba(255,255,255,0.05)" />
                      {visibleChannels.speedRef && (
                        <path
                          d="M 0,90 Q 60,95 100,30 L 220,12 L 280,75 L 350,35 L 420,80 L 510,40 L 600,90 L 688,25 L 780,18 L 860,65 L 940,90 L 1000,45"
                          fill="none"
                          stroke="#71717a"
                          strokeDasharray="3 3"
                          strokeWidth="1.2"
                        />
                      )}
                      <path
                        d={graphPaths.speed}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Channel 2: Throttle & Brake */}
              {(visibleChannels.throttle || visibleChannels.brake) && (
                <div className="eng-channel-row eng-ch-pedals">
                  <div className="eng-y-axis">
                    <span className="eng-y-white">100%</span>
                    <span className="eng-y-red">100 B</span>
                    <span>50</span>
                    <span>0% / 0B</span>
                  </div>
                  <div className="eng-ch-graph">
                    <svg className="eng-ch-svg" preserveAspectRatio="none" viewBox="0 0 1000 100">
                      <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.05)" />
                      {visibleChannels.throttle && (
                        <path
                          d={graphPaths.throttle}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}
                      {visibleChannels.brake && (
                        <path
                          d={graphPaths.brake}
                          fill="none"
                          stroke="#e11d24"
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                  </div>
                </div>
              )}

              {/* Channel 3: Gear */}
              {visibleChannels.gear && (
                <div className="eng-channel-row eng-ch-gear">
                  <div className="eng-y-axis">
                    <span>G8</span>
                    <span>G6</span>
                    <span>G4</span>
                    <span>G2</span>
                    <span>G0</span>
                  </div>
                  <div className="eng-ch-graph">
                    <svg className="eng-ch-svg" preserveAspectRatio="none" viewBox="0 0 1000 80">
                      <path
                        d={graphPaths.gear}
                        fill="none"
                        stroke="#c3c6d0"
                        strokeWidth="1.75"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Channel 4: Steering */}
              {visibleChannels.steering && (
                <div className="eng-channel-row eng-ch-steer">
                  <div className="eng-y-axis">
                    <span>+60°</span>
                    <span className="eng-y-white">0° CTR</span>
                    <span>-60°</span>
                  </div>
                  <div className="eng-ch-graph">
                    <svg className="eng-ch-svg" preserveAspectRatio="none" viewBox="0 0 1000 80">
                      <line x1="0" y1="40" x2="1000" y2="40" stroke="rgba(255,255,255,0.12)" />
                      <path
                        d={graphPaths.steering}
                        fill="none"
                        stroke="#c3c6d0"
                        strokeWidth="1.25"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Data-Driven X-Axis Turn & Sector Identifiers Bar */}
            <div className="eng-x-axis-bar">
              <div className="eng-x-lbl-head">{axisMode === "distance" ? "DIST" : "TIME"}</div>
              <div className="eng-x-ticks-row">
                {trackMarkers.map((m, idx) => (
                  <span
                    key={idx}
                    className={m.highlight ? "eng-red-text font-bold" : ""}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Replay Controls & Timeline ────────────────────────────── */}
        <section className="eng-panel eng-replay-panel">
          {/* Sector Partition Bar */}
          <div className="eng-sector-partition">
            <div className="eng-sector-cell">
              <div className="eng-sec-info">
                <strong>SECTOR 1</strong>
                <span className="eng-sec-sub">0M - 2,230M</span>
              </div>
              <div className="eng-sec-time">
                <span>31.240s</span>
                <span className="eng-sec-sub">(-0.042)</span>
              </div>
            </div>

            <div className="eng-sector-cell eng-sec-active">
              <div className="eng-sec-info">
                <strong className="eng-red-text">SECTOR 2 (ACTIVE)</strong>
                <span className="eng-sec-sub">2,230M - 5,120M</span>
              </div>
              <div className="eng-sec-time">
                <span className="eng-red-text">58.420s</span>
                <span className="eng-red-text text-[10px]">(+0.184)</span>
              </div>
            </div>

            <div className="eng-sector-cell">
              <div className="eng-sec-info">
                <strong>SECTOR 3</strong>
                <span className="eng-sec-sub">5,120M - 7,004M</span>
              </div>
              <div className="eng-sec-time">
                <span>47.724s</span>
                <span className="eng-sec-sub">(--)</span>
              </div>
            </div>
          </div>

          {/* Scrubber Needle Track */}
          <div className="eng-scrubber-track" onClick={handleScrubberClick}>
            <div className="eng-scrubber-fill" style={{ width: `${playheadPct}%` }} />
            <div className="eng-scrubber-thumb" style={{ left: `${playheadPct}%` }} />
          </div>

          {/* Transport Controls Row Driven by useTelemetryPlayback */}
          <div className="eng-transport-row">
            <div className="eng-transport-btns">
              <button type="button" className="eng-btn-ctrl">|&lt; PREV LAP</button>
              <button
                type="button"
                className="eng-btn-ctrl"
                onClick={() => seekToElapsedSec(Math.max(0, playbackElapsedSec - 5))}
              >
                &lt;&lt; -5s
              </button>

              <button
                type="button"
                className={`eng-btn-ctrl ${isPlaying ? "eng-btn-play-active" : ""}`}
                onClick={isPlaying ? pause : play}
              >
                {isPlaying ? "⏸ PAUSE" : "▶ PLAYING"}
              </button>

              <button
                type="button"
                className="eng-btn-ctrl"
                onClick={() => seekToElapsedSec(Math.min(totalDurationSec, playbackElapsedSec + 5))}
              >
                +5s &gt;&gt;
              </button>
              <button type="button" className="eng-btn-ctrl">NEXT LAP &gt;|</button>

              <button
                type="button"
                className="eng-btn-ctrl eng-btn-ml"
                onClick={reset}
              >
                RESET
              </button>
            </div>

            <div className="eng-hud-timer">
              <div>
                <span className="eng-lbl-grey">LAP TIME: </span>
                <strong className="eng-val-white">{formatTime(playbackElapsedSec)}</strong>
                <span className="eng-lbl-grey"> / {formatTime(totalDurationSec)}</span>
              </div>
              <div>
                <span className="eng-lbl-grey">DISTANCE: </span>
                <strong className="eng-val-white">{liveDistanceM.toLocaleString()} M</strong>
                <span className="eng-lbl-grey"> / {totalDistanceM.toLocaleString()} M</span>
              </div>
            </div>

            {/* Standardized Speed Selectors (0.5x, 1.0x, 2.0x, 4.0x) */}
            <div className="eng-speed-export-row">
              <div className="eng-speed-selector">
                {[0.5, 1.0, 2.0, 4.0].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    className={`eng-spd-btn ${playbackSpeed === spd ? "eng-spd-active" : ""}`}
                    onClick={() => setPlaybackSpeed(spd)}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
              <PearlButton icon="⬇">EXPORT CSV / CAN</PearlButton>
            </div>
          </div>
        </section>

        {/* ── Chassis System Notices & Warnings ────────────────────── */}
        <section className="eng-notices-grid">
          {analysisResults && analysisResults.length > 0 ? (
            analysisResults.map((item, idx) => {
              const isWarn = item.severity === "Warning";
              const isSuccess = item.severity === "Success";
              const icon = isWarn ? "⚠" : isSuccess ? "✓" : "ℹ";

              return (
                <div
                  key={idx}
                  className={`eng-notice-card ${isWarn ? "eng-notice-warning" : ""}`}
                >
                  <span className={`eng-notice-icon ${isWarn ? "eng-red-text" : ""}`}>
                    {icon}
                  </span>
                  <div>
                    <strong className={`eng-notice-title ${isWarn ? "eng-red-text" : ""}`}>
                      {item.title.toUpperCase()}
                    </strong>
                    <p className="eng-notice-body">{item.recommendation}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className="eng-notice-card">
                <span className="eng-notice-icon">ℹ</span>
                <div>
                  <strong className="eng-notice-title">AERO BAL SHIFT</strong>
                  <p className="eng-notice-body">
                    High-speed compression through Eau Rouge induced +2.1mm front
                    splitter rake dive.
                  </p>
                </div>
              </div>

              <div className="eng-notice-card eng-notice-warning">
                <span className="eng-notice-icon eng-red-text">⚠</span>
                <div>
                  <strong className="eng-notice-title eng-red-text">
                    DELTA PINCH: T14 APEX
                  </strong>
                  <p className="eng-notice-body">
                    Throttle roll-on delayed by 0.08s compared to reference lap baseline.
                  </p>
                </div>
              </div>

              <div className="eng-notice-card">
                <span className="eng-notice-icon">✓</span>
                <div>
                  <strong className="eng-notice-title">POWERTRAIN THERMALS</strong>
                  <p className="eng-notice-body">
                    MGU-K operating within target efficiency window (62°C inverter / 98.2% harvest).
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="eng-footer">
          <div>LOC // SILICON VALLEY TRACK DEV + LAT 37.3861° N LONG 122.0839° W</div>
          <div>TELEMETRY SYNCED © 2025 APEXFORGE ARCHITECTURE</div>
        </footer>
      </div>
    </KineticGrid>
  );
}
