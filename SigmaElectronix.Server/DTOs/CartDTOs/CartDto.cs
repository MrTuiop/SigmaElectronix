namespace SigmaElectronix.Server.DTOs.CartDTOs
{
    public class CartDto
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public List<CartItemDto> Items { get; set; } = new();
        public decimal Total => Items.Sum(i => i.TotalPrice);
        public DateTime UpdatedAt { get; set; }
    }
}
