import { useEffect, useState } from "react";
import { getVehicles } from "../services/api";
import VehicleCard from "../components/VehicleCard";
import "./Garage.css";

function Garage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getVehicles()
            .then((data) => {
                setVehicles(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setError("Could not load vehicles.");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <h1>Loading Garage...</h1>;
    }

    if (error) {
        return <h1>{error}</h1>;
    }

    return (
        <main className="garage-page">
            <header className="garage-header">
                <h1 className="garage-title">ApexForge Garage</h1>

                <p className="garage-subtitle">
                    Your Motorsport Vehicle Collection
                </p>
            </header>

            {vehicles.length === 0 ? (
                <div className="garage-empty">
                    No vehicles available.
                </div>
            ) : (
                <div className="vehicle-grid">
                    {vehicles.map((vehicle) => (
                        <VehicleCard
                            key={vehicle.vehicleId}
                            vehicle={vehicle}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

export default Garage;