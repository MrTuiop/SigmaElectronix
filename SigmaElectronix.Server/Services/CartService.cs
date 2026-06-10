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

        public CartService(ApplicationDbContext context, ILogger<CartService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<CartDto> GetCartAsync(string? userId, string? sessionId)
        {
            var cart = await GetOrCreateCartAsync(userId, sessionId);

            return await MapCartToDtoAsync(cart);
        }

        public async Task<CartDto> AddItemToCartAsync(string? userId, string? sessionId, AddToCartRequest request)
        {
            var cart = await GetOrCreateCartAsync(userId, sessionId);

            // Проверяем, есть ли товар уже в корзине
            var existingItem = cart.Items
                .FirstOrDefault(i => i.ProductId == request.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += request.Quantity;
                existingItem.UnitPrice = request.Price; // Обновляем цену на актуальную
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
                // Просто привязываем гостевую корзину к пользователю
                guestCart.UserId = userId;
                guestCart.SessionId = null;
            }
            else
            {
                // Объединяем товары
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
                // Удаляем гостевую корзину
                _context.Carts.Remove(guestCart);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Guest cart merged for user {UserId}", userId);
        }

        // 🔹 Приватные вспомогательные методы
        private async Task<Cart> GetOrCreateCartAsync(string? userId, string? sessionId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items) // ⚠️ ВАЖНОЕ ИСПРАВЛЕНИЕ: Загружаем товары вместе с корзиной
                .FirstOrDefaultAsync(c =>
                    (userId != null && c.UserId == userId) ||
                    (sessionId != null && c.SessionId == sessionId && c.UserId == null));

            if (cart != null) return cart;

            // Если корзины нет - создаем новую
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
            // 🎯 Получаем все ID товаров из корзины
            var productIds = cart.Items.Select(i => i.ProductId).ToList();

            // 🎯 Загружаем ВСЕ товары с картинками ОДНИМ запросом
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id))
                .Include(p => p.Images)
                .ToDictionaryAsync(p => p.Id);

            // 🎯 Маппим в DTO
            var itemDtos = cart.Items.Select(item =>
            {
                products.TryGetValue(item.ProductId, out var product);

                var mainImage = product?.Images
                    .OrderBy(i => i.SortOrder)
                    .FirstOrDefault(i => i.IsPrimary)?.Url
                    ?? product?.Images
                        .OrderBy(i => i.SortOrder)
                        .FirstOrDefault()?.Url;

                return new CartItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = product?.Name ?? "Unknown",
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
