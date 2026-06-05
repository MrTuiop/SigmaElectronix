namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty; // Например, "SUMMER2024"
        public string Description { get; set; } = string.Empty;

        public decimal DiscountValue { get; set; } // Сумма или процент
        public bool IsPercentage { get; set; } // true = %, false = фиксированная сумма

        public decimal MinOrderAmount { get; set; } // Минимальная сумма заказа для применения
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int MaxUsageCount { get; set; } // 0 = безлимит
        public int CurrentUsageCount { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
