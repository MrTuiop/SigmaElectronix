using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using SigmaElectronix.Server.Entities.CartModels;
using SigmaElectronix.Server.Entities.OrderModels;
using SigmaElectronix.Server.Entities.StoreModels;
using System.ComponentModel.DataAnnotations.Schema;

namespace SigmaElectronix.Server.Entities.UserModels
{
    public class ApplicationUser : IdentityUser
    {
        // - Email
        // - PhoneNumber
        // - PasswordHash
        // - UserName (обычно используется как Email)
        // - EmailConfirmed, PhoneNumberConfirmed
        // - TwoFactorEnabled
        // - LockoutEnd, LockoutEnabled, AccessFailedCount

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}"; // Вычисляемое свойство

        public string? AvatarUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Выбранный город пользователя (для отображения цен и наличия)
        public int? PreferredCityId { get; set; }
        public City? PreferredCity { get; set; }

        // Любимый магазин (для быстрого самовывоза)
        public int? PreferredStoreId { get; set; }
        public Store? PreferredStore { get; set; }

        public decimal BonusBalance { get; set; } = 0;

        // Навигационные свойства
        public ICollection<BonusTransaction> BonusTransactions { get; set; } = new List<BonusTransaction>();
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public Cart? Cart { get; set; }
    }
}
