using SigmaElectronix.Server.Entities.UserModels;

namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class BonusTransaction
    {
        public int Id { get; set; }

        // Связь с пользователем (у IdentityUser по умолчанию Id имеет тип string)
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        // Сумма операции: положительная (начисление) или отрицательная (списание)
        // Например: +500 (кэшбэк), -200 (оплата заказа)
        public decimal Amount { get; set; }

        // Описание для клиента ("Бонус за регистрацию", "Списание за заказ #1005")
        public string Reason { get; set; } = string.Empty;

        // Если бонус связан с конкретным заказом (nullable, так как бонусы могут дать просто на ДР)
        public int? OrderId { get; set; }
        public Order? Order { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ОПЦИОНАЛЬНО: Если бонусы могут "сгорать", добавляем дату сгорания
        public DateTime? ExpiresAt { get; set; }
    }
}
