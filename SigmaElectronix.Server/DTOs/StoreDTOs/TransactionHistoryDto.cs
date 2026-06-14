namespace SigmaElectronix.Server.DTOs.StoreDTOs
{
    public class TransactionHistoryDto
    {
        public int Id { get; set; }
        public string TransactionType { get; set; } = string.Empty; // "Поступление", "Продажа" и тд.
        public int QuantityChange { get; set; }
        public string? ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
