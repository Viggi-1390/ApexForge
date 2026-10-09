using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApexForge.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ApexForge.Api.Services;

public class TelemetryService
{
    private readonly IMongoCollection<TelemetrySession> _sessions;
    private readonly IMongoCollection<TelemetrySample> _points;
    private readonly IMongoDatabase _database;

    public TelemetryService(IMongoDatabase database)
    {
        _database = database;
        _sessions = database.GetCollection<TelemetrySession>("sessions");
        _points = database.GetCollection<TelemetrySample>("telemetry_points");

        // Ensure compound index on telemetry_points for fast, deterministic, isolated retrieval
        var indexKeys = Builders<TelemetrySample>.IndexKeys
            .Ascending(p => p.SessionId)
            .Ascending(p => p.SampleIndex);

        var indexOptions = new CreateIndexOptions { Background = true };
        _points.Indexes.CreateOne(new CreateIndexModel<TelemetrySample>(indexKeys, indexOptions));
    }

    public async Task<TelemetrySession?> GetSessionByIdAsync(int sessionId)
    {
        return await _sessions
            .Find(s => s.SessionId == sessionId)
            .FirstOrDefaultAsync();
    }

    public async Task<List<TelemetrySample>> GetSamplesBySessionIdAsync(int sessionId)
    {
        return await _points
            .Find(p => p.SessionId == sessionId)
            .SortBy(p => p.SampleIndex)
            .ToListAsync();
    }

    public async Task<TelemetrySession?> GetLatestSessionAsync(int? vehicleId, int? trackId)
    {
        var filterBuilder = Builders<TelemetrySession>.Filter;
        var filter = filterBuilder.Empty;

        if (vehicleId.HasValue && vehicleId.Value > 0)
        {
            filter &= filterBuilder.Eq(s => s.VehicleId, vehicleId.Value);
        }

        if (trackId.HasValue && trackId.Value > 0)
        {
            filter &= filterBuilder.Eq(s => s.TrackId, trackId.Value);
        }

        return await _sessions
            .Find(filter)
            .SortByDescending(s => s.SessionId)
            .FirstOrDefaultAsync();
    }

    public async Task<TelemetrySession> SeedDemoSessionAsync(int vehicleId = 1, int trackId = 101)
    {
        // Obtain autoincrement sessionId counter
        var counters = _database.GetCollection<BsonDocument>("counters");
        var counterFilter = Builders<BsonDocument>.Filter.Eq("_id", "sessionId");
        var counterUpdate = Builders<BsonDocument>.Update.Inc("sequence", 1);
        var counterOptions = new FindOneAndUpdateOptions<BsonDocument>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await counters.FindOneAndUpdateAsync(counterFilter, counterUpdate, counterOptions);
        int nextSessionId = counter["sequence"].ToInt32();

        var session = new TelemetrySession
        {
            SessionId = nextSessionId,
            VehicleId = vehicleId,
            TrackId = trackId,
            SessionName = "DEMO TELEMETRY RUN",
            SessionType = "PRACTICE 1",
            DateUtc = DateTime.UtcNow,
            TotalLaps = 1,
            IsDemoData = true
        };

        // Generate deterministic synthetic telemetry samples (~7004 meters, 137.384 seconds)
        var samples = new List<TelemetrySample>();
        int totalSamples = 500;
        double trackLengthM = 7004.0;
        double totalDurationSec = 137.384;

        for (int i = 0; i < totalSamples; i++)
        {
            double progress = (double)i / (totalSamples - 1);
            double timeSec = Math.Round(progress * totalDurationSec, 3);
            double distM = Math.Round(progress * trackLengthM, 2);

            // Realistic physics curves
            double speed = Math.Round(180.0 + Math.Sin(progress * Math.PI * 6) * 70.0, 1);
            int gear = Math.Min(6, Math.Max(1, (int)(speed / 45.0) + 1));
            int rpm = Math.Min(9000, (int)(5500 + (speed % 50) * 70));
            double throttle = speed > 210 ? 94.0 : Math.Round((speed / 250.0) * 100.0, 1);
            double brake = speed < 190 ? Math.Round((200.0 - speed) * 1.2, 1) : 0.0;
            double steering = Math.Round(Math.Sin(progress * Math.PI * 8) * 35.0, 1);

            samples.Add(new TelemetrySample
            {
                SessionId = nextSessionId,
                SampleIndex = i,
                TimestampSec = timeSec,
                DistanceM = distM,
                SpeedKmh = Math.Max(0.0, speed),
                RPM = rpm,
                Gear = gear,
                ThrottlePct = Math.Clamp(throttle, 0.0, 100.0),
                BrakeBar = Math.Clamp(brake, 0.0, 100.0),
                SteeringDeg = Math.Clamp(steering, -180.0, 180.0),
                GLat = Math.Round(Math.Sin(progress * Math.PI * 8) * 2.2, 2),
                GLon = Math.Round(Math.Cos(progress * Math.PI * 6) * 1.5, 2)
            });
        }

        session.TotalPoints = samples.Count;
        await _sessions.InsertOneAsync(session);
        await _points.InsertManyAsync(samples);

        return session;
    }
}
