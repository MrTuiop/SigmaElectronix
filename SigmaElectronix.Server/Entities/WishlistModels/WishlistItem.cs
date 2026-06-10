using SigmaElectronix.Server.Entities.ProductModels;

namespace SigmaElectronix.Server.Entities.WishlistModels
{
    public class WishlistItem
    {
        public int Id { get; set; }
        public int WishlistId { get; set; }
        public Wishlist Wishlist { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
