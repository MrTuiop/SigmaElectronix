namespace SigmaElectronix.Server.Enums
{
    public enum PaymentStatus
    {
        Pending,    // Ожидает оплаты
        Paid,       // Оплачен
        Failed,     // Ошибка оплаты
        Refunded,   // Возврат
        Expired     // Истёк срок резерва
    }
}
