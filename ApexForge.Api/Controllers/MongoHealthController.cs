
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ApexForge.Api.Controllers;

[ApiController]
[Route("api/mongo-health")]
public class MongoHealthController : ControllerBase
{
    private readonly IMongoDatabase _database;

    public MongoHealthController(IMongoDatabase database)
    {
        _database = database;
    }

    [HttpGet]
    public async Task<IActionResult> CheckConnection()
    {
        try
        {
            var result = await _database.RunCommandAsync<BsonDocument>(
                new BsonDocument("ping", 1));

            return Ok(new
            {
                status = "Connected",
                database = _database.DatabaseNamespace.DatabaseName,
                result = result["ok"].ToDouble()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "Connection failed",
                message = ex.Message
            });
        }
    }
}