using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.CouponDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        // ==========================================
        // ПУБЛИЧНЫЕ ЭНДПОИНТЫ (Для Корзины)
        // ==========================================

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { message = "Введите промокод" });

            var result = await _couponService.ValidateCouponAsync(request.Code, request.CartTotal);

            if (!result.IsValid)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message, coupon = result.Coupon });
        }


        // ==========================================
        // АДМИНИСТРАТИВНЫЕ ЭНДПОИНТЫ (CRUD)
        // ==========================================

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<CouponDto>>> GetAll()
        {
            return Ok(await _couponService.GetAllAsync());
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CouponDto>> GetById(int id)
        {
            var coupon = await _couponService.GetByIdAsync(id);
            if (coupon == null) return NotFound(new { message = "Промокод не найден" });

            return Ok(coupon);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CouponDto>> Create([FromBody] CreateUpdateCouponDto dto)
        {
            try
            {
                var coupon = await _couponService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, coupon);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CouponDto>> Update(int id, [FromBody] CreateUpdateCouponDto dto)
        {
            try
            {
                var coupon = await _couponService.UpdateAsync(id, dto);
                if (coupon == null) return NotFound(new { message = "Промокод не найден" });

                return Ok(coupon);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _couponService.DeleteAsync(id);
            if (!result) return NotFound(new { message = "Промокод не найден" });

            return NoContent();
        }
    }
}