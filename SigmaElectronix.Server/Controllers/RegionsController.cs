using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.LocationDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegionsController : ControllerBase
    {
        private readonly IRegionService _regionService;

        public RegionsController(IRegionService regionService)
        {
            _regionService = regionService;
        }

        [HttpGet]
        public async Task<ActionResult<List<RegionDto>>> GetAll()
        {
            return Ok(await _regionService.GetAllAsync());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RegionDto>> GetById(int id)
        {
            var region = await _regionService.GetByIdAsync(id);
            if (region == null) return NotFound(new { message = "Регион не найден" });
            return Ok(region);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<RegionDto>> Create([FromBody] CreateUpdateRegionDto dto)
        {
            var region = await _regionService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = region.Id }, region);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<RegionDto>> Update(int id, [FromBody] CreateUpdateRegionDto dto)
        {
            var region = await _regionService.UpdateAsync(id, dto);
            if (region == null) return NotFound(new { message = "Регион не найден" });
            return Ok(region);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")] // Удалять регионы логично только Админу
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _regionService.DeleteAsync(id);
                if (!result) return NotFound(new { message = "Регион не найден" });
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message }); // 400 если в регионе есть города
            }
        }
    }
}