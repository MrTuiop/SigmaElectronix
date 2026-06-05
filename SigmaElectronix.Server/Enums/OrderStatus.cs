namespace SigmaElectronix.Server.Enums
{
    public enum OrderStatus
    {
        Pending,       // Ожидает оплаты
        Paid,          // Оплачен
        Processing,    // В обработке на складе
        Shipped,       // Отправлен
        Delivered,     // Доставлен
        Cancelled,     // Отменен
        Refunded       // Возврат средств
    }
}
