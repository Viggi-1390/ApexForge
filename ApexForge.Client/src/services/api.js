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