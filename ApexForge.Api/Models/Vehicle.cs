
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ApexForge.Api.Models;

public class Vehicle
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("vehicleId")]
    public int VehicleId { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("horsepower")]
    public int Horsepower { get; set; }
}