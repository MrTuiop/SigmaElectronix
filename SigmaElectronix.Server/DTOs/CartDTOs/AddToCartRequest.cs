namespace SigmaElectronix.Server.DTOs.CartDTOs
{
    public class AddToCartRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal Price { get; set; } // Цена на момент добавления
    }
}
