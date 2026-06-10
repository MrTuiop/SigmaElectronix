using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.WishlistDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpGet]
        public async Task<ActionResult<WishlistDto>> GetWishlist()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            var wishlist = await _wishlistService.GetWishlistAsync(userId, sessionId);
            return Ok(wishlist);
        }

        // Единый метод для добавления/удаления по клику на сердечко
        [HttpPost("toggle/{productId:int}")]
        public async Task<ActionResult<WishlistDto>> ToggleItem(int productId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            var wishlist = await _wishlistService.ToggleItemAsync(userId, sessionId, productId);
            return Ok(wishlist);
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var sessionId = GetSessionId();

            await _wishlistService.ClearWishlistAsync(userId, sessionId);
            return NoContent();
        }

        [HttpPost("merge")]
        [Authorize]
        public async Task<IActionResult> MergeGuestWishlist()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!;
            var sessionId = GetSessionId();

            if (!string.IsNullOrEmpty(sessionId))
            {
                await _wishlistService.MergeGuestWishlistAsync(sessionId, userId);
            }

            return NoContent();
        }

        private string? GetSessionId()
        {
            return Request.Cookies["sessionId"];
        }
    }
}