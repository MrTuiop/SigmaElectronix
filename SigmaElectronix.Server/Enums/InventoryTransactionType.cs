namespace SigmaElectronix.Server.Enums
{
    public enum InventoryTransactionType
    {
        Receipt,       // Поступление товара (приход)
        Sale,          // Продажа
        Return,        // Возврат от покупателя
        TransferOut,   // Перемещение (списание со склада-отправителя)
        TransferIn,    // Перемещение (поступление на склад-получатель)
        Adjustment,    // Ручная корректировка (инвентаризация)
        WriteOff       // Списание (брак, утеря)
    }
}
