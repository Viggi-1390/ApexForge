
using ApexForge.Api.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace ApexForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IMongoCollection<Vehicle> _vehicles;
    private readonly IMongoDatabase _database;

    public VehiclesController(IMongoDatabase database)
    {
        _database = database;
        _vehicles = database.GetCollection<Vehicle>("vehicles");
    }

    // GET: api/vehicles
    [HttpGet]
    public async Task<IActionResult> GetVehicles()
    {
        var vehicles = await _vehicles
            .Find(FilterDefinition<Vehicle>.Empty)
            .SortBy(v => v.VehicleId)
            .ToListAsync();

        return Ok(vehicles);
    }

    // POST: api/vehicles
    [HttpPost]
    public async Task<IActionResult> CreateVehicle(Vehicle vehicle)
    {
        if (string.IsNullOrWhiteSpace(vehicle.Name) ||
            string.IsNullOrWhiteSpace(vehicle.Category) ||
            vehicle.Horsepower <= 0)
        {
            return BadRequest(
                "Name, category, and positive horsepower are required.");
        }

        // Generate the next VehicleId using an atomic counter.
        var counters = _database.GetCollection<MongoDB.Bson.BsonDocument>(
            "counters");

        var counterFilter = Builders<MongoDB.Bson.BsonDocument>.Filter
            .Eq("_id", "vehicleId");

        var counterUpdate = Builders<MongoDB.Bson.BsonDocument>.Update
            .Inc("sequence", 1);

        var counterOptions =
            new FindOneAndUpdateOptions<MongoDB.Bson.BsonDocument>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            };

        var counter = await counters.FindOneAndUpdateAsync(
            counterFilter, counterUpdate, counterOptions);

        vehicle.VehicleId = counter["sequence"].ToInt32();
        vehicle.Id = null;

        await _vehicles.InsertOneAsync(vehicle);

        return Created(
            $"/api/vehicles/{vehicle.VehicleId}",
            vehicle);
    }

    // PUT: api/vehicles/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateVehicle(
        int id, Vehicle vehicle)
    {
        if (id != vehicle.VehicleId)
        {
            return BadRequest("Vehicle ID does not match.");
        }

        var filter = Builders<Vehicle>.Filter
            .Eq(v => v.VehicleId, id);

        var existingVehicle = await _vehicles
            .Find(filter)
            .FirstOrDefaultAsync();

        if (existingVehicle == null)
        {
            return NotFound();
        }

        existingVehicle.Name = vehicle.Name;
        existingVehicle.Category = vehicle.Category;
        existingVehicle.Horsepower = vehicle.Horsepower;

        await _vehicles.ReplaceOneAsync(filter, existingVehicle);

        return Ok(existingVehicle);
    }
    
    // DELETE: api/vehicles/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var filter = Builders<Vehicle>.Filter
            .Eq(v => v.VehicleId, id);

        var result = await _vehicles.DeleteOneAsync(filter);

        if (result.DeletedCount == 0)
        {
            return NotFound(new
            {
                message = $"Vehicle with ID {id} was not found."
            });
        }

        return Ok(new
        {
            message = $"Vehicle {id} deleted successfully."
        });
    }
}