namespace SigmaElectronix.Server.DTOs.CouponDTOs
{
    public class CreateUpdateCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public bool IsPercentage { get; set; }
        public decimal MinOrderAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxUsageCount { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
