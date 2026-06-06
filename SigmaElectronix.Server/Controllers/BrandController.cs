using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.BrandDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    namespace SigmaElectronix.Server.Controllers
    {
        [ApiController]
        [Route("api/[controller]")]
        public class BrandsController : ControllerBase
        {
            private readonly IBrandService _brandService;

            public BrandsController(IBrandService brandService)
            {
                _brandService = brandService;
            }

            // ====== Публичные endpoints (для покупателей) ======

            // GET: api/brands?pageNumber=1&pageSize=20
            [HttpGet]
            public async Task<IActionResult> GetBrands([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
            {
                var result = await _brandService.GetBrandsAsync(pageNumber, pageSize);
                return Ok(result);
            }

            // GET: api/brands/featured?count=6
            [HttpGet("featured")]
            public async Task<IActionResult> GetFeaturedBrands([FromQuery] int count = 6)
            {
                var brands = await _brandService.GetFeaturedBrandsAsync(count);
                return Ok(brands);
            }

            // GET: api/brands/slug/apple
            [HttpGet("slug/{slug}")]
            public async Task<IActionResult> GetBrandShowcase(string slug)
            {
                var showcase = await _brandService.GetBrandBySlugAsync(slug);
                if (showcase == null)
                {
                    return NotFound(new { message = "Бренд не найден" });
                }

                return Ok(showcase);
            }

            // ====== Административные endpoints ======

            // POST: api/brands
            [HttpPost]
            [Authorize(Roles = "Admin,Manager")]
            public async Task<IActionResult> CreateBrand([FromBody] CreateBrandDto dto)
            {
                var brand = await _brandService.CreateBrandAsync(dto);
                // Обратите внимание: возвращаем 201 Created и ссылку на получение созданного бренда
                return CreatedAtAction(nameof(GetBrandShowcase), new { slug = brand.Slug }, brand);
            }

            // PUT: api/brands/5
            [HttpPut("{id:int}")]
            [Authorize(Roles = "Admin,Manager")]
            public async Task<IActionResult> UpdateBrand(int id, [FromBody] UpdateBrandDto dto)
            {
                var brand = await _brandService.UpdateBrandAsync(id, dto);
                if (brand == null)
                {
                    return NotFound(new { message = "Бренд не найден" });
                }

                return Ok(brand);
            }

            // DELETE: api/brands/5
            [HttpDelete("{id:int}")]
            [Authorize(Roles = "Admin")]
            public async Task<IActionResult> DeleteBrand(int id)
            {
                var success = await _brandService.DeleteBrandAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Бренд не найден или уже удален" });
                }

                return NoContent(); // 204 No Content - стандарт для успешного удаления
            }
        }
    }
}
