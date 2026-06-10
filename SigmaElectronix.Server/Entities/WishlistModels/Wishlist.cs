namespace SigmaElectronix.Server.Entities.WishlistModels
{
    public class Wishlist
    {
        public int Id { get; set; }
        public string? UserId { get; set; } // Null для гостей
        public string? SessionId { get; set; } // Для гостей
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<WishlistItem> Items { get; set; } = new();
    }
}
