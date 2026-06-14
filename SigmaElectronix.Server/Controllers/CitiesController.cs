using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.LocationDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitiesController : ControllerBase
    {
        private readonly ICityService _cityService;

        public CitiesController(ICityService cityService)
        {
            _cityService = cityService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CityDto>>> GetAll()
        {
            return Ok(await _cityService.GetAllAsync());
        }

        // Полезный метод для фронтенда: получить города конкретного региона
        [HttpGet("region/{regionId:int}")]
        public async Task<ActionResult<List<CityDto>>> GetByRegionId(int regionId)
        {
            return Ok(await _cityService.GetByRegionIdAsync(regionId));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CityDto>> GetById(int id)
        {
            var city = await _cityService.GetByIdAsync(id);
            if (city == null) return NotFound(new { message = "Город не найден" });
            return Ok(city);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CityDto>> Create([FromBody] CreateUpdateCityDto dto)
        {
            try
            {
                var city = await _cityService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = city.Id }, city);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message }); // Если передан неверный RegionId
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CityDto>> Update(int id, [FromBody] CreateUpdateCityDto dto)
        {
            try
            {
                var city = await _cityService.UpdateAsync(id, dto);
                if (city == null) return NotFound(new { message = "Город не найден" });
                return Ok(city);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _cityService.DeleteAsync(id);
                if (!result) return NotFound(new { message = "Город не найден" });
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message }); // Ошибка если привязаны магазины/юзеры
            }
        }
    }
}