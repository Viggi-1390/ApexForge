using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ApexForge.Api.Models;

public class TelemetrySession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("sessionId")]
    public int SessionId { get; set; }

    [BsonElement("vehicleId")]
    public int VehicleId { get; set; }

    [BsonElement("trackId")]
    public int TrackId { get; set; }

    [BsonElement("sessionName")]
    public string SessionName { get; set; } = string.Empty;

    [BsonElement("sessionType")]
    public string SessionType { get; set; } = "PRACTICE 1";

    [BsonElement("dateUtc")]
    public DateTime DateUtc { get; set; } = DateTime.UtcNow;

    [BsonElement("totalLaps")]
    public int TotalLaps { get; set; } = 1;

    [BsonElement("totalPoints")]
    public int TotalPoints { get; set; }

    [BsonElement("isDemoData")]
    public bool IsDemoData { get; set; }
}

public class TelemetrySample
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("sessionId")]
    public int SessionId { get; set; }

    [BsonElement("sampleIndex")]
    public int SampleIndex { get; set; }

    [BsonElement("timestampSec")]
    public double TimestampSec { get; set; }

    [BsonElement("distanceM")]
    public double DistanceM { get; set; }

    [BsonElement("speedKmh")]
    public double SpeedKmh { get; set; }

    [BsonElement("rpm")]
    public int RPM { get; set; }

    [BsonElement("gear")]
    public int Gear { get; set; }

    [BsonElement("throttlePct")]
    public double ThrottlePct { get; set; }

    [BsonElement("brakeBar")]
    public double BrakeBar { get; set; }

    [BsonElement("steeringDeg")]
    public double SteeringDeg { get; set; }

    [BsonElement("gLat")]
    public double? GLat { get; set; }

    [BsonElement("gLon")]
    public double? GLon { get; set; }

    [BsonElement("gVert")]
    public double? GVert { get; set; }
}
