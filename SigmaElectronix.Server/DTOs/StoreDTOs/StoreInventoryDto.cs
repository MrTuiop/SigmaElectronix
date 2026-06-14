namespace SigmaElectronix.Server.DTOs.StoreDTOs
{
    public class StoreInventoryDto
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool IsReservable { get; set; }
    }
}
