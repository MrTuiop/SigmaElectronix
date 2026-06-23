using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.WishlistDTOs;
using SigmaElectronix.Server.Entities.WishlistModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class WishlistService : IWishlistService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public WishlistService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
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

        public async Task<WishlistDto> GetWishlistAsync(string? userId, string? sessionId)
        {
            var wishlist = await GetOrCreateWishlistAsync(userId, sessionId);
            return await MapToDtoAsync(wishlist);
        }

        public async Task<WishlistDto> ToggleItemAsync(string? userId, string? sessionId, int productId)
        {
            var wishlist = await GetOrCreateWishlistAsync(userId, sessionId);

            var existingItem = wishlist.Items.FirstOrDefault(i => i.ProductId == productId);

            if (existingItem != null)
            {
                // Если товар уже в избранном — удаляем его (снимаем лайк)
                wishlist.Items.Remove(existingItem);
            }
            else
            {
                // Если нет — добавляем
                wishlist.Items.Add(new WishlistItem { ProductId = productId });
            }

            wishlist.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await MapToDtoAsync(wishlist);
        }

        public async Task<bool> ClearWishlistAsync(string? userId, string? sessionId)
        {
            var wishlist = await GetWishlistWithItemsAsync(userId, sessionId);
            if (!wishlist.Items.Any()) return true;

            _context.WishlistItems.RemoveRange(wishlist.Items);
            wishlist.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task MergeGuestWishlistAsync(string sessionId, string userId)
        {
            var guestWishlist = await _context.Wishlists
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.SessionId == sessionId && w.UserId == null);

            var userWishlist = await _context.Wishlists
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (guestWishlist == null || !guestWishlist.Items.Any()) return;

            if (userWishlist == null)
            {
                guestWishlist.UserId = userId;
                guestWishlist.SessionId = null;
            }
            else
            {
                foreach (var guestItem in guestWishlist.Items)
                {
                    if (!userWishlist.Items.Any(i => i.ProductId == guestItem.ProductId))
                    {
                        userWishlist.Items.Add(new WishlistItem { ProductId = guestItem.ProductId });
                    }
                }
                _context.Wishlists.Remove(guestWishlist);
            }

            await _context.SaveChangesAsync();
        }

        // --- Вспомогательные приватные методы ---
        private async Task<Wishlist> GetOrCreateWishlistAsync(string? userId, string? sessionId)
        {
            var wishlist = await _context.Wishlists
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w =>
                    (userId != null && w.UserId == userId) ||
                    (sessionId != null && w.SessionId == sessionId && w.UserId == null));

            if (wishlist != null) return wishlist;

            wishlist = new Wishlist { UserId = userId, SessionId = sessionId };
            _context.Wishlists.Add(wishlist);
            await _context.SaveChangesAsync();
            return wishlist;
        }

        private async Task<Wishlist> GetWishlistWithItemsAsync(string? userId, string? sessionId)
        {
            return await _context.Wishlists
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w =>
                    (userId != null && w.UserId == userId) ||
                    (sessionId != null && w.SessionId == sessionId && w.UserId == null))
                ?? throw new InvalidOperationException("Wishlist not found");
        }

        private async Task<WishlistDto> MapToDtoAsync(Wishlist wishlist)
        {
            var lang = GetCurrentLanguage(); // 🚀 1. Получаем текущий язык из запроса

            var productIds = wishlist.Items.Select(i => i.ProductId).ToList();

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id))
                .Include(p => p.Images)
                .Include(p => p.Brand)
                    .ThenInclude(b => b.Translations)
                .Include(p => p.Translations)
                .ToDictionaryAsync(p => p.Id);

            var thresholdDate = DateTime.UtcNow.AddDays(-30);

            var itemDtos = wishlist.Items.Select(item =>
            {
                products.TryGetValue(item.ProductId, out var product);

                var mainImage = product?.Images
                    .OrderBy(i => i.SortOrder)
                    .FirstOrDefault(i => i.IsPrimary)?.Url
                    ?? product?.Images
                        .OrderBy(i => i.SortOrder)
                        .FirstOrDefault()?.Url;

                // 🚀 2. Подставляем lang вместо "ru" для названия товара
                var productName = product?.Translations.FirstOrDefault(t => t.LanguageCode == lang)?.Name
                               ?? product?.Translations.FirstOrDefault()?.Name
                               ?? "Unknown";

                // 🚀 3. Подставляем lang вместо "ru" для названия бренда
                var brandName = product?.Brand?.Translations.FirstOrDefault(t => t.LanguageCode == lang)?.Name
                             ?? product?.Brand?.Translations.FirstOrDefault()?.Name;

                return new WishlistItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = productName,
                    ProductImage = mainImage,
                    Price = product?.Price ?? 0,

                    BrandName = brandName,
                    AverageRating = product?.AverageRating ?? 0,
                    ReviewsCount = product?.ReviewsCount ?? 0,
                    DiscountPrice = product?.DiscountPrice,

                    IsNew = product != null && product.CreatedAt >= thresholdDate
                };
            }).ToList();

            return new WishlistDto
            {
                Id = wishlist.Id,
                UserId = wishlist.UserId,
                Items = itemDtos
            };
        }
    }
}