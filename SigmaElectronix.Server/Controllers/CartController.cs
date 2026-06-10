using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.CartDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        // 🔹 GET: api/cart
        [HttpGet]
        public async Task<ActionResult<CartDto>> GetCart()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            var cart = await _cartService.GetCartAsync(userId, sessionId);
            return Ok(cart);
        }

        // 🔹 POST: api/cart/items
        [HttpPost("items")]
        public async Task<ActionResult<CartDto>> AddItem([FromBody] AddToCartRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            try
            {
                var cart = await _cartService.AddItemToCartAsync(userId, sessionId, request);
                return Ok(cart);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding item to cart", error = ex.Message });
            }
        }

        // 🔹 PUT: api/cart/items/{itemId}
        [HttpPut("items/{itemId:int}")]
        public async Task<ActionResult<CartDto>> UpdateItem(int itemId, [FromBody] UpdateCartItemRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            try
            {
                var cart = await _cartService.UpdateItemQuantityAsync(userId, sessionId, itemId, request.Quantity);
                return Ok(cart);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Cart item not found" });
            }
        }

        // 🔹 DELETE: api/cart/items/{itemId}
        [HttpDelete("items/{itemId:int}")]
        public async Task<IActionResult> RemoveItem(int itemId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            var result = await _cartService.RemoveItemAsync(userId, sessionId, itemId);
            return result ? NoContent() : NotFound();
        }

        // 🔹 DELETE: api/cart/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            await _cartService.ClearCartAsync(userId, sessionId);
            return NoContent();
        }

        // 🔹 POST: api/cart/merge (при авторизации)
        [HttpPost("merge")]
        [Authorize]
        public async Task<IActionResult> MergeGuestCart()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!;
            var sessionId = GetSessionId();

            if (!string.IsNullOrEmpty(sessionId))
            {
                await _cartService.MergeGuestCartAsync(sessionId, userId);
            }

            return NoContent();
        }

        // 🔹 Вспомогательный метод для получения SessionId
        private string GetSessionId()
        {
            var sessionId = Request.Cookies["sessionId"];

            // Если куки нет (новый гость) — создаем её и отдаем браузеру
            if (string.IsNullOrEmpty(sessionId))
            {
                sessionId = Guid.NewGuid().ToString();
                var cookieOptions = new CookieOptions
                {
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(30), // Запоминаем корзину на 30 дней
                    HttpOnly = true, // Защита от XSS
                    SameSite = SameSiteMode.Lax // Разрешаем передачу куки между фронтом и бэком
                };
                Response.Cookies.Append("sessionId", sessionId, cookieOptions);
            }

            return sessionId;
        }
    }
}
