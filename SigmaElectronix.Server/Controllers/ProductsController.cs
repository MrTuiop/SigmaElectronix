using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.ProductDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        // GET: api/products?categoryId=1&brandId=2&minPrice=100&maxPrice=1000&search=iphone&sortBy=price_asc&pageNumber=1&pageSize=12
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] ProductFilterDto filter)
        {
            var result = await _productService.GetProductsAsync(filter);
            return Ok(result);
        }

        // GET: api/products/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Товар не найден" });

            return Ok(product);
        }

        // GET: api/products/slug/iphone-15-pro-max
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetProductBySlug(string slug)
        {
            var product = await _productService.GetProductBySlugAsync(slug);
            if (product == null)
                return NotFound(new { message = "Товар не найден" });

            return Ok(product);
        }

        // GET: api/products/featured
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeatured([FromQuery] int count = 8)
        {
            var products = await _productService.GetFeaturedProductsAsync(count);
            return Ok(products);
        }

        [HttpGet("new")]
        public async Task<IActionResult> GetNewArrivals([FromQuery] int count = 8)
        {
            var products = await _productService.GetNewArrivalsAsync(count);
            return Ok(products);
        }

        // GET: api/products/discounted
        [HttpGet("discounted")]
        public async Task<IActionResult> GetDiscounted([FromQuery] int count = 8)
        {
            var products = await _productService.GetDiscountedProductsAsync(count);
            return Ok(products);
        }

        // GET: api/products/5/related
        [HttpGet("{id:int}/related")]
        public async Task<IActionResult> GetRelated(int id, [FromQuery] int count = 4)
        {
            var products = await _productService.GetRelatedProductsAsync(id, count);
            return Ok(products);
        }

        // ====== Административные endpoints ======

        // GET: api/products/admin
        [HttpGet("admin")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAllAdmin([FromQuery] ProductFilterDto filter)
        {
            var result = await _productService.GetAllProductsAdminAsync(filter);
            return Ok(result);
        }

        // POST: api/products
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _productService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // PUT: api/products/5
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _productService.UpdateProductAsync(id, dto);
            if (product == null)
                return NotFound(new { message = "Товар не найден" });

            return Ok(product);
        }

        // DELETE: api/products/5
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _productService.DeleteProductAsync(id);
            if (!success)
                return NotFound(new { message = "Товар не найден" });

            return NoContent();
        }

        // POST: api/products/5/restore
        [HttpPost("{id:int}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(int id)
        {
            var success = await _productService.RestoreProductAsync(id);
            if (!success)
                return NotFound(new { message = "Товар не найден" });

            return Ok(new { message = "Товар восстановлен" });
        }

        // GET: api/products/filters?categoryId=1
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters([FromQuery] int? categoryId)
        {
            try
            {
                var filters = await _productService.GetAvailableFiltersAsync(categoryId);
                return Ok(filters);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка при загрузке фильтров", error = ex.Message });
            }
        }

        // POST: api/products/5/toggle-status
        [HttpPost("{id:int}/toggle-status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _productService.TogglePublishStatusAsync(id);
            if (!success)
                return NotFound(new { message = "Товар не найден" });

            return Ok(new { message = "Статус изменен" });
        }
    }
}
