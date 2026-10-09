import { useState, useEffect, useCallback } from "react";
import Garage from "./pages/Garage";
import Tracks from "./pages/Tracks";
import Engineering from "./pages/Engineering";

// Helper keys for sessionStorage persistence
const STORAGE_KEY_VEHICLE = "apexforge_selected_vehicle";
const STORAGE_KEY_TRACK = "apexforge_selected_track";
const STORAGE_KEY_VIEW = "apexforge_current_view";

// View map to hash mapping
const HASH_MAP = {
  garage: "#garage",
  tracks: "#tracks",
  engineering: "#engineering",
};

const getSavedJson = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialView = (vehicle, track) => {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#engineering" || hash === "#telemetry") {
    if (!vehicle && !track) return "garage";
    return "engineering";
  }
  if (hash === "#tracks") return "tracks";
  const saved = sessionStorage.getItem(STORAGE_KEY_VIEW);
  if (saved && ["garage", "tracks", "engineering"].includes(saved)) {
    if (saved === "engineering" && !vehicle && !track) return "garage";
    return saved;
  }
  return "garage";
};

function App() {
  const [selectedVehicle, setSelectedVehicle] = useState(() => getSavedJson(STORAGE_KEY_VEHICLE));
  const [selectedTrack, setSelectedTrack] = useState(() => getSavedJson(STORAGE_KEY_TRACK));
  const [currentView, setCurrentView] = useState(() =>
    getInitialView(getSavedJson(STORAGE_KEY_VEHICLE), getSavedJson(STORAGE_KEY_TRACK))
  );

  // Sync state to sessionStorage & window history hash
  const navigateTo = useCallback((view, replaceHistory = false) => {
    setCurrentView(view);
    sessionStorage.setItem(STORAGE_KEY_VIEW, view);
    const hash = HASH_MAP[view] || "#garage";
    if (window.location.hash !== hash) {
      if (replaceHistory) {
        window.history.replaceState({ view }, "", hash);
      } else {
        window.history.pushState({ view }, "", hash);
      }
    }
  }, []);

  // Listen for browser back / forward buttons (popstate) & hash changes
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.toLowerCase();
      const savedVehicle = getSavedJson(STORAGE_KEY_VEHICLE);
      const savedTrack = getSavedJson(STORAGE_KEY_TRACK);
      let view = "garage";
      if (hash === "#tracks") {
        view = "tracks";
      } else if (hash === "#engineering" || hash === "#telemetry") {
        view = savedVehicle || savedTrack ? "engineering" : "garage";
      }
      setCurrentView(view);
      sessionStorage.setItem(STORAGE_KEY_VIEW, view);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  // Stage 1 Action: Select Vehicle & Auto-Navigate to Stage 2 (Tracks)
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      sessionStorage.setItem(STORAGE_KEY_VEHICLE, JSON.stringify(vehicle));
    } catch (e) {
      console.error("Could not persist selected vehicle", e);
    }
    // Auto-navigate to Track Selection (Stage 2)
    navigateTo("tracks");
  };

  // Stage 2 Action: Select Track & Auto-Navigate to Stage 3 (Telemetry Analysis)
  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
    try {
      sessionStorage.setItem(STORAGE_KEY_TRACK, JSON.stringify(track));
    } catch (e) {
      console.error("Could not persist selected track", e);
    }
    // Auto-navigate to Telemetry Analysis (Stage 3)
    navigateTo("engineering");
  };

  if (currentView === "tracks") {
    return (
      <Tracks
        onNavigate={(v) => navigateTo(v)}
        selectedTrackId={selectedTrack?.trackId}
        onSelectTrack={handleSelectTrack}
      />
    );
  }

  if (currentView === "engineering") {
    return (
      <Engineering
        onNavigate={(v) => navigateTo(v)}
        selectedVehicle={selectedVehicle}
        selectedTrack={selectedTrack}
      />
    );
  }

  return (
    <Garage
      onNavigate={(v) => navigateTo(v)}
      selectedVehicleId={selectedVehicle?.vehicleId}
      onSelectVehicle={handleSelectVehicle}
    />
  );
}

export default App;