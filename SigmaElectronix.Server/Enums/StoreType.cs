namespace SigmaElectronix.Server.Enums
{
    public enum StoreType
    {
        Retail,         // Розничный магазин (можно прийти, потрогать, купить)
        PickupPoint,    // Только пункт выдачи заказов
        Warehouse,      // Склад (клиенты не ходят, только отгрузка)
        ServiceCenter   // Сервисный центр (ремонт)
    }
}
