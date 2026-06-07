namespace SigmaElectronix.Server.DTOs.ProfileDTOs
{
    public class BonusTransactionDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; } // +500 или -200
        public string Reason { get; set; } = string.Empty; // "Кэшбэк за покупку"
        public DateTime CreatedAt { get; set; }

        // Вместо полной сущности заказа отдаем только ID и его красивый номер для ссылки
        public int? OrderId { get; set; }
        public string? OrderNumber { get; set; }
    }
}
