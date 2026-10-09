using System.Threading.Tasks;
using ApexForge.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace ApexForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly TelemetryService _telemetryService;
    private readonly TelemetryAnalysisService _analysisService;
    private readonly IWebHostEnvironment _environment;

    public TelemetryController(
        TelemetryService telemetryService,
        TelemetryAnalysisService analysisService,
        IWebHostEnvironment environment)
    {
        _telemetryService = telemetryService;
        _analysisService = analysisService;
        _environment = environment;
    }

    // GET: api/telemetry/session/{id}
    [HttpGet("session/{id:int}")]
    public async Task<IActionResult> GetSessionTelemetry(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new { success = false, message = "Session ID must be a positive integer." });
        }

        var session = await _telemetryService.GetSessionByIdAsync(id);
        if (session == null)
        {
            return NotFound(new { success = false, message = $"Session ID {id} not found." });
        }

        var samples = await _telemetryService.GetSamplesBySessionIdAsync(id);

        return Ok(new
        {
            success = true,
            sessionId = session.SessionId,
            sessionName = session.SessionName,
            sessionType = session.SessionType,
            vehicleId = session.VehicleId,
            trackId = session.TrackId,
            totalLaps = session.TotalLaps,
            totalPoints = samples.Count,
            isDemoData = session.IsDemoData,
            data = samples
        });
    }

    // GET: api/telemetry/latest?vehicleId=1&trackId=101
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatestTelemetry([FromQuery] int? vehicleId = null, [FromQuery] int? trackId = null)
    {
        if ((vehicleId.HasValue && vehicleId.Value <= 0) || (trackId.HasValue && trackId.Value <= 0))
        {
            return BadRequest(new { success = false, message = "Vehicle ID and Track ID must be positive integers." });
        }

        var session = await _telemetryService.GetLatestSessionAsync(vehicleId, trackId);
        if (session == null)
        {
            return NotFound(new { success = false, message = "No telemetry session found for requested vehicle and track." });
        }

        var samples = await _telemetryService.GetSamplesBySessionIdAsync(session.SessionId);

        return Ok(new
        {
            success = true,
            sessionId = session.SessionId,
            sessionName = session.SessionName,
            sessionType = session.SessionType,
            vehicleId = session.VehicleId,
            trackId = session.TrackId,
            totalLaps = session.TotalLaps,
            totalPoints = samples.Count,
            isDemoData = session.IsDemoData,
            data = samples
        });
    }

    // GET: api/telemetry/analysis/{sessionId}
    [HttpGet("analysis/{sessionId:int}")]
    public async Task<IActionResult> GetSessionAnalysis(int sessionId)
    {
        if (sessionId <= 0)
        {
            return BadRequest(new { success = false, message = "Session ID must be a positive integer." });
        }

        var session = await _telemetryService.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            return NotFound(new { success = false, message = $"Session ID {sessionId} not found." });
        }

        var samples = await _telemetryService.GetSamplesBySessionIdAsync(sessionId);
        var analysis = _analysisService.AnalyzeSession(session, samples);

        return Ok(new
        {
            success = true,
            sessionId = session.SessionId,
            analysisCount = analysis.Count,
            results = analysis
        });
    }

    // POST: api/telemetry/seed-demo
    // Development-only endpoint. Server-side enforced.
    [HttpPost("seed-demo")]
    public async Task<IActionResult> SeedDemoSession([FromQuery] int vehicleId = 1, [FromQuery] int trackId = 101)
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound(new { success = false, message = "Demo seeding endpoint is available in Development mode only." });
        }

        var session = await _telemetryService.SeedDemoSessionAsync(vehicleId, trackId);
        var samples = await _telemetryService.GetSamplesBySessionIdAsync(session.SessionId);

        return Created($"/api/telemetry/session/{session.SessionId}", new
        {
            success = true,
            message = "Demonstration telemetry session seeded successfully.",
            sessionId = session.SessionId,
            totalPoints = samples.Count,
            isDemoData = session.IsDemoData,
            data = samples
        });
    }
}
