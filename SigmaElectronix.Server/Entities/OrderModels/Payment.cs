namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class Payment
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;
        public string PaymentMethod { get; set; } = string.Empty; // "CreditCard", "PayPal", "CashOnDelivery"
        public string? TransactionId { get; set; } // ID от платежного шлюза (Stripe, CloudPayments и т.д.)
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending", "Success", "Failed"
        public DateTime? PaidAt { get; set; }
    }
}
