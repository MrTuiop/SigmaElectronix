namespace SigmaElectronix.Server.DTOs.WishlistDTOs
{
    public class WishlistItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public decimal Price { get; set; } // Текущая цена товара

        // 🎯 ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ ДЛЯ КРАСИВОЙ КАРТОЧКИ:
        public string? BrandName { get; set; }
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
        public decimal? DiscountPrice { get; set; } // Если вдруг на товар в избранном появилась скидка

        public bool IsNew { get; set; }
    }
}