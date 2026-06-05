namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class Shipment
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;
        public string Carrier { get; set; } = string.Empty; // "СДЭК", "Почта России", "DHL"
        public string? TrackingNumber { get; set; }
        public DateTime? ShippedDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public string Status { get; set; } = "Processing";
    }
}
