using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.CartDTOs;
using SigmaElectronix.Server.Entities.CartModels;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class CartService : ICartService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CartService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CartService(ApplicationDbContext context, ILogger<CartService> logger, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetCurrentLanguage()
        {
            var langHeader = _httpContextAccessor.HttpContext?.Request.Headers["Accept-Language"].ToString();
            if (!string.IsNullOrEmpty(langHeader))
            {
                var primaryLang = langHeader.Split(',')[0].Split('-')[0].Trim().ToLower();
                if (primaryLang.Length >= 2) return primaryLang.Substring(0, 2);
                return primaryLang;
            }
            return "ru";
        }

        public async Task<CartDto> GetCartAsync(string? userId, string? sessionId)
        {
            var cart = await GetOrCreateCartAsync(userId, sessionId);
            return await MapCartToDtoAsync(cart);
        }

        public async Task<CartDto> AddItemToCartAsync(string? userId, string? sessionId, AddToCartRequest request)
        {
            var cart = await GetOrCreateCartAsync(userId, sessionId);

            var existingItem = cart.Items
                .FirstOrDefault(i => i.ProductId == request.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += request.Quantity;
                existingItem.UnitPrice = request.Price;
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    UnitPrice = request.Price
                });
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Item {ProductId} added to cart for user {UserId}",
                request.ProductId, userId ?? sessionId);

            return await MapCartToDtoAsync(cart);
        }

        public async Task<CartDto> UpdateItemQuantityAsync(string? userId, string? sessionId, int itemId, int quantity)
        {
            var cart = await GetCartWithItemsAsync(userId, sessionId);

            var item = cart.Items.FirstOrDefault(i => i.Id == itemId)
                ?? throw new KeyNotFoundException($"CartItem {itemId} not found");

            if (quantity <= 0)
            {
                cart.Items.Remove(item);
            }
            else
            {
                item.Quantity = quantity;
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await MapCartToDtoAsync(cart);
        }

        public async Task<bool> RemoveItemAsync(string? userId, string? sessionId, int itemId)
        {
            var cart = await GetCartWithItemsAsync(userId, sessionId);

            var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null) return false;

            cart.Items.Remove(item);
            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ClearCartAsync(string? userId, string? sessionId)
        {
            var cart = await GetCartWithItemsAsync(userId, sessionId);

            if (!cart.Items.Any()) return true;

            _context.CartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task MergeGuestCartAsync(string sessionId, string userId)
        {
            var guestCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.SessionId == sessionId && c.UserId == null);

            var userCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (guestCart == null) return;

            if (userCart == null)
            {
                guestCart.UserId = userId;
                guestCart.SessionId = null;
            }
            else
            {
                foreach (var guestItem in guestCart.Items)
                {
                    var existingItem = userCart.Items
                        .FirstOrDefault(i => i.ProductId == guestItem.ProductId);

                    if (existingItem != null)
                    {
                        existingItem.Quantity += guestItem.Quantity;
                    }
                    else
                    {
                        userCart.Items.Add(guestItem);
                    }
                }
                _context.Carts.Remove(guestCart);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Guest cart merged for user {UserId}", userId);
        }

        private async Task<Cart> GetOrCreateCartAsync(string? userId, string? sessionId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c =>
                    (userId != null && c.UserId == userId) ||
                    (sessionId != null && c.SessionId == sessionId && c.UserId == null));

            if (cart != null) return cart;

            cart = new Cart
            {
                UserId = userId,
                SessionId = sessionId
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
            return cart;
        }

        private async Task<Cart> GetCartWithItemsAsync(string? userId, string? sessionId)
        {
            return await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c =>
                    (userId != null && c.UserId == userId) ||
                    (sessionId != null && c.SessionId == sessionId && c.UserId == null))
                ?? throw new InvalidOperationException("Cart not found");
        }

        private async Task<CartDto> MapCartToDtoAsync(Cart cart)
        {
            var lang = GetCurrentLanguage(); // 🚀 1. Получаем текущий язык из запроса

            var productIds = cart.Items.Select(i => i.ProductId).ToList();

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id))
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .ToDictionaryAsync(p => p.Id);

            var itemDtos = cart.Items.Select(item =>
            {
                products.TryGetValue(item.ProductId, out var product);

                var mainImage = product?.Images
                    .OrderBy(i => i.SortOrder)
                    .FirstOrDefault(i => i.IsPrimary)?.Url
                    ?? product?.Images
                        .OrderBy(i => i.SortOrder)
                        .FirstOrDefault()?.Url;

                // 🚀 2. Подставляем переменную lang вместо DefaultLanguage
                var productName = product?.Translations
                    .FirstOrDefault(t => t.LanguageCode == lang)?.Name
                    ?? product?.Translations?.FirstOrDefault()?.Name
                    ?? "Unknown";

                return new CartItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = productName,
                    ProductImage = mainImage,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                };
            }).ToList();

            return new CartDto
            {
                Id = cart.Id,
                UserId = cart.UserId,
                Items = itemDtos,
                UpdatedAt = cart.UpdatedAt
            };
        }
    }
}