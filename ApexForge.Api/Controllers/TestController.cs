using Microsoft.AspNetCore.Mvc;

namespace ApexForge.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                message = "ApexForge API is working!",
                status = "online"
            });
        }
    }
}