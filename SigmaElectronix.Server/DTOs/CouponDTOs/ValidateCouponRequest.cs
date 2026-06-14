namespace SigmaElectronix.Server.DTOs.CouponDTOs
{
    public class ValidateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public decimal CartTotal { get; set; }
    }
}
