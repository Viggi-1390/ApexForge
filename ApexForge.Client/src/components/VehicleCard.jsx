function VehicleCard({ vehicle }) {
    return (
        <article className="vehicle-card">

            <div className="vehicle-image">
                <span>Vehicle Image</span>
            </div>

            <div className="vehicle-info">

                <h2 className="vehicle-name">
                    {vehicle.name}
                </h2>

                <p className="vehicle-category">
                    {vehicle.category}
                </p>

                <div className="vehicle-specs">

                    <div>
                        <div className="vehicle-spec-label">
                            Power
                        </div>

                        <div className="vehicle-spec-value">
                            {vehicle.horsepower} HP
                        </div>
                    </div>

                </div>

            </div>

        </article>
    );
}

export default VehicleCard;