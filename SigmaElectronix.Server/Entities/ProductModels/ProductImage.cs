namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class ProductImage
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } // Вот оно, главное фото!
        public int DisplayOrder { get; set; }
    }
}
