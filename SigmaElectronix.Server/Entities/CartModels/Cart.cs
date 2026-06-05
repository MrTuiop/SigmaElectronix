using SigmaElectronix.Server.Entities.UserModels;
using System.ComponentModel.DataAnnotations.Schema;

namespace SigmaElectronix.Server.Entities.CartModels
{
    public class Cart
    {
        public int Id { get; set; }
        public string? UserId { get; set; } // Null для гостей
        public ApplicationUser? User { get; set; }
        public string? SessionId { get; set; } // Для анонимных пользователей
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<CartItem> Items { get; set; } = new List<CartItem>();

        [NotMapped] 
        public decimal Total => Items.Sum(i => i.Quantity * i.UnitPrice);
    }
}
