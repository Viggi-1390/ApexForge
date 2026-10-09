const API_BASE_URL = "http://localhost:5006";

export async function testApi() {
    const response = await fetch(`${API_BASE_URL}/api/test`);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
}

export async function getVehicles() {
    const response = await fetch(`${API_BASE_URL}/api/vehicles`);

    if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
    }

    return await response.json();
}

// ─── Track Data & Service ───────────────────────────────────────────────────
const VERIFIED_TRACKS = [
    {
        trackId: 101,
        name: "Silverstone Circuit",
        country: "United Kingdom",
        circuitType: "Permanent Road Course",
        lengthKm: 5.891,
        turns: 18,
        layoutVariant: "Grand Prix Circuit",
        imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=750&fit=crop&q=80"
    },
    {
        trackId: 102,
        name: "Circuit de Spa-Francorchamps",
        country: "Belgium",
        circuitType: "Permanent Road Course",
        lengthKm: 7.004,
        turns: 19,
        layoutVariant: "Grand Prix Layout",
        imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&h=750&fit=crop&q=80"
    },
    {
        trackId: 103,
        name: "Circuit de Monaco",
        country: "Monaco",
        circuitType: "Street Circuit",
        lengthKm: 3.337,
        turns: 19,
        layoutVariant: "Monte Carlo GP",
        imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&h=750&fit=crop&q=80"
    },
    {
        trackId: 104,
        name: "Nürburgring Grand Prix",
        country: "Germany",
        circuitType: "Permanent Road Course",
        lengthKm: 5.148,
        turns: 16,
        layoutVariant: "GP-Strecke",
        imageUrl: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1200&h=750&fit=crop&q=80"
    },
    {
        trackId: 105,
        name: "Autodromo Nazionale Monza",
        country: "Italy",
        circuitType: "Permanent High-Speed Circuit",
        lengthKm: 5.793,
        turns: 11,
        layoutVariant: "Stradale GP",
        imageUrl: "https://images.unsplash.com/photo-1534093607318-f025413f49cb?w=1200&h=750&fit=crop&q=80"
    }
];

export async function getTracks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tracks`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
        }
    } catch {
        // Fallback to verified dataset
    }

    return new Promise((resolve) => {
        setTimeout(() => resolve(VERIFIED_TRACKS), 200);
    });
}

// ─── Telemetry API Service ──────────────────────────────────────────────────

export async function getLatestTelemetry(vehicleId, trackId) {
    try {
        let url = `${API_BASE_URL}/api/telemetry/latest`;
        const params = [];
        if (vehicleId) params.push(`vehicleId=${vehicleId}`);
        if (trackId) params.push(`trackId=${trackId}`);
        if (params.length > 0) url += `?${params.join("&")}`;

        const response = await fetch(url);
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.warn("Backend telemetry API unaccessible, using baseline telemetry dataset.", err);
    }
    return null;
}

export async function getTelemetrySession(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telemetry/session/${sessionId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.warn("Backend telemetry session endpoint unaccessible.", err);
    }
    return null;
}

export async function getTelemetryAnalysis(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telemetry/analysis/${sessionId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.warn("Backend telemetry analysis endpoint unaccessible.", err);
    }
    return null;
}